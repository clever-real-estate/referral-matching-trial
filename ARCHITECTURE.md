# Architecture

## Components

```
Upstream lead platform ──(webhook, shared token)──▶ Django/DRF backend ◀──(token auth)── React frontend
                                                          │
                                                     PostgreSQL
```

- **Backend** (`backend/`): Django + DRF. Receives intake webhooks, runs
  eligibility and ranking, creates offers, handles claims/declines, exposes
  the Operations dashboard and override endpoints.
- **Frontend** (`frontend/`): React + TypeScript + Vite. Two views: the agent
  offer queue and the Operations dashboard. In dev, Vite proxies `/api` to the
  backend on port 8000.
- **Upstream platform**: mocked by `tools/send_webhook.py`. Deliveries carry a
  shared token header (`X-Webhook-Token`) and may be retried by the sender.

## Data model

| Model           | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `Agent`         | A real-estate agent: license states, service area ZIP prefixes, price band, capacity, performance score (nullable — newer agents have no history). Linked 1:1 to a Django user. |
| `Referral`      | A customer request: contact info, state/ZIP, estimated price, intent level, status (`new → offered → assigned/closed`), optional assigned agent. `external_id` is the upstream platform's identifier. |
| `Offer`         | An invitation for one agent to claim one referral. Carries the match score, a score explanation, an eligibility snapshot taken at matching time, and an expiry (10 minutes). |
| `Claim`         | An agent's ownership of a referral. `active` is cleared when released (e.g., by an Operations override). |
| `ReferralEvent` | Append-only audit trail per referral: received, candidates generated, offer sent/declined/expired, claim attempted/succeeded/conflicted, ops override. |

## Request flows

### Intake

`POST /api/webhooks/referrals/` (shared token) → validate payload → create
`Referral` → record `referral_received` → score agents (`matching.py`) →
create top-N `Offer`s with eligibility snapshots → record `offer_sent` events
→ referral status becomes `offered`.

### Agent queue

`GET /api/offers/mine/` (agent token) → expire overdue pending offers →
return the agent's pending offers with nested referral details.

### Claim / decline

`POST /api/offers/<id>/claim/` → `claims.claim_offer()`: validates the offer
is open and unexpired, creates a `Claim`, assigns the referral, marks the
offer accepted, sends the customer/agent notification, records
`claim_succeeded`.

`POST /api/offers/<id>/decline/` → marks the offer declined and records
`offer_declined`.

### Operations

- `GET /api/ops/referrals/` (staff token) → all referrals with offers, agent,
  and event timeline.
- `POST /api/ops/referrals/<id>/override/` → release active claims, reassign
  (or unassign), record `ops_override`.

## Auth model

DRF `TokenAuthentication`. Seeded identities get deterministic tokens
(`tok-<username>`); staff users (`is_staff`) have Operations access. The
`GET /api/identities/` endpoint powers the dev sign-in picker and only exists
with `DEBUG=1`.

## Matching

`matching.score_agent()` combines geographic fit, price fit, performance, and
capacity headroom into a weighted score (weights in `matching.py`), and
`build_offers()` ranks agents and offers the referral to the top three. Each
offer stores `score_explanation` (per-factor contributions) and
`eligibility_snapshot` (the output of `eligibility.evaluate()` at matching
time) so the queue UI can explain the match.
