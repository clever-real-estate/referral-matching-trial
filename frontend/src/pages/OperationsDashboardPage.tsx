import { Fragment, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Identity, OpsReferral } from "../types";

interface Props {
  identity: Identity | null;
}

function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / (24 * 60))}d`;
}

export default function OperationsDashboardPage({ identity }: Props) {
  const viewer = identity?.display_name ?? "Operations";
  const [referrals, setReferrals] = useState<OpsReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [overrideAgent, setOverrideAgent] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<OpsReferral[]>("/api/ops/referrals/")
      .then(setReferrals)
      .catch((err) => {
        setError(
          err?.status === 403
            ? "Operations access required. Switch to an ops identity."
            : "Could not load referrals."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function submitOverride(referral: OpsReferral) {
    const agentId = overrideAgent.trim() === "" ? null : Number(overrideAgent);
    api
      .post(`/api/ops/referrals/${referral.id}/override/`, {
        agent_id: agentId,
        note: "manual override from dashboard",
      })
      .then(() => {
        setNotice(`Referral ${referral.external_id} overridden.`);
        setOverrideAgent("");
        load();
      })
      .catch(() => setNotice("Override failed."));
  }

  if (loading) {
    return <p className="state-note">Loading referrals… this can take a moment.</p>;
  }
  if (error) {
    return (
      <div className="state-note error-banner">
        {error} <button onClick={load}>Retry</button>
      </div>
    );
  }
  if (referrals.length === 0) {
    return <p className="state-note">No referrals yet.</p>;
  }

  return (
    <section>
      <h2>Operations Dashboard</h2>
      <p className="subtitle">Monitoring as {viewer}</p>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      <table className="ops-table">
        <thead>
          <tr>
            <th>Referral</th>
            <th>Customer</th>
            <th>Market</th>
            <th>Status</th>
            <th>Assigned agent</th>
            <th>Age</th>
            <th>Offers</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <Fragment key={r.id}>
              <tr>
                <td>{r.external_id}</td>
                <td>{r.customer_name}</td>
                <td>
                  {r.state} {r.postal_code}
                </td>
                <td>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </td>
                <td>{r.assigned_agent?.name ?? "—"}</td>
                <td>{formatAge(r.age_minutes)}</td>
                <td>
                  {r.offers.map((o) => (
                    <span key={o.id} className={`chip chip-${o.status}`} title={o.agent}>
                      {o.agent.split(" ")[0]}: {o.status}
                    </span>
                  ))}
                </td>
                <td>
                  <button
                    className="link-btn"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  >
                    {expanded === r.id ? "Hide" : "Timeline"}
                  </button>
                </td>
              </tr>
              {expanded === r.id && (
                <tr className="detail-row">
                  <td colSpan={8}>
                    <div className="timeline">
                      <h4>Event timeline</h4>
                      <ol>
                        {r.events.map((e) => (
                          <li key={e.id}>
                            <code>{new Date(e.created_at).toLocaleString()}</code>{" "}
                            <strong>{e.event_type}</strong>
                            {e.actor && <> — {e.actor}</>}
                          </li>
                        ))}
                      </ol>
                      <div className="override-box">
                        <label>
                          Reassign to agent id:{" "}
                          <input
                            value={overrideAgent}
                            onChange={(e) => setOverrideAgent(e.target.value)}
                            placeholder="blank to unassign"
                          />
                        </label>
                        <button onClick={() => submitOverride(r)}>Apply override</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}
