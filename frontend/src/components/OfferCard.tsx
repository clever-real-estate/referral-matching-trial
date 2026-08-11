import type { Offer } from "../types";

interface Props {
  offer: Offer;
  onClaim: (offer: Offer) => void;
  onDecline: (offer: Offer) => void;
  busy: boolean;
}

function formatPrice(value: number): string {
  return `$${(value / 1000).toFixed(0)}k`;
}

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

const INTENT_LABELS: Record<string, string> = {
  hot: "Hot — ready now",
  warm: "Warm",
  browsing: "Browsing",
};

export default function OfferCard({ offer, onClaim, onDecline, busy }: Props) {
  const { referral } = offer;
  const expiresIn = minutesUntil(offer.expires_at);

  return (
    <article className="offer-card" data-testid={`offer-${offer.id}`}>
      <div className="offer-card-header">
        <h3>{referral.customer_name}</h3>
        <span className={`intent intent-${referral.intent_level}`}>
          {INTENT_LABELS[referral.intent_level] ?? referral.intent_level}
        </span>
      </div>
      <dl className="offer-facts">
        <div>
          <dt>Location</dt>
          <dd>
            {referral.state} {referral.postal_code}
          </dd>
        </div>
        <div>
          <dt>Est. price</dt>
          <dd>{formatPrice(referral.estimated_price)}</dd>
        </div>
        <div>
          <dt>Expires</dt>
          <dd className={expiresIn <= 3 ? "urgent" : ""}>
            {expiresIn > 0 ? `in ${expiresIn} min` : "expired"}
          </dd>
        </div>
      </dl>
      <details className="match-explanation">
        <summary>Why you were matched</summary>
        <ul>
          {Object.entries(offer.score_explanation)
            .filter(([key]) => key !== "total")
            .map(([key, value]) => (
              <li key={key}>
                {key.replace(/_/g, " ")}: {value}
              </li>
            ))}
          <li>
            <strong>total: {offer.score_explanation.total ?? offer.score.toFixed(3)}</strong>
          </li>
        </ul>
      </details>
      <div className="offer-actions">
        <button className="claim-btn" disabled={busy} onClick={() => onClaim(offer)}>
          Claim referral
        </button>
        <button className="decline-btn" disabled={busy} onClick={() => onDecline(offer)}>
          ✕
        </button>
      </div>
    </article>
  );
}
