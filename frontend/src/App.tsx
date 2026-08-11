import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api/client";
import AgentQueuePage from "./pages/AgentQueuePage";
import OperationsDashboardPage from "./pages/OperationsDashboardPage";
import type { Identity } from "./types";

type Tab = "queue" | "ops";

export default function App() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [current, setCurrent] = useState<Identity | null>(null);
  const [tab, setTab] = useState<Tab>("queue");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api
      .get<Identity[]>("/api/identities/")
      .then((list) => {
        setIdentities(list);
        const saved = getToken();
        const match = list.find((i) => i.token === saved) ?? list[0] ?? null;
        if (match) {
          setToken(match.token);
          setCurrent(match);
          setTab(match.role === "ops" ? "ops" : "queue");
        }
      })
      .catch(() => setLoadError(true));
  }, []);

  function signInAs(username: string) {
    const identity = identities.find((i) => i.username === username);
    if (!identity) return;
    setToken(identity.token);
    setCurrent(identity);
    setTab(identity.role === "ops" ? "ops" : "queue");
  }

  if (loadError) {
    return (
      <div className="shell">
        <p className="error-banner">
          Could not reach the API. Is the backend running on port 8000?
        </p>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <h1>Referral Matching Pilot</h1>
        <div className="topbar-controls">
          <nav>
            <button
              className={tab === "queue" ? "tab active" : "tab"}
              onClick={() => setTab("queue")}
            >
              Agent Queue
            </button>
            <button
              className={tab === "ops" ? "tab active" : "tab"}
              onClick={() => setTab("ops")}
            >
              Operations
            </button>
          </nav>
          <label className="identity-picker">
            Signed in as{" "}
            <select
              value={current?.username ?? ""}
              onChange={(e) => signInAs(e.target.value)}
            >
              {identities.map((i) => (
                <option key={i.username} value={i.username}>
                  {i.display_name} ({i.role})
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main>
        {tab === "queue" ? (
          <AgentQueuePage key={current?.username ?? "none"} identity={current} />
        ) : (
          <OperationsDashboardPage key={current?.username ?? "none"} identity={current} />
        )}
      </main>
    </div>
  );
}
