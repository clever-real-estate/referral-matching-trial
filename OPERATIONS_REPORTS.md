# Operations Reports — Referral Matching Pilot

Collected by the pilot operations team during internal dry-runs. Reproduced
as received; some reports may be incomplete or describe the same underlying
issue. Referral identifiers refer to the seeded dataset (`make seed`).

---

## Report 1 — Licensing exposure

> From: Riley (Ops)
>
> An agent in Colorado told us they briefly saw a referral card for a customer
> in Texas — full name and phone number visible — even though they're only
> licensed in Colorado. By the time they refreshed, it was gone from their
> queue. They asked whether we're supposed to be showing them out-of-state
> customers at all. Legal will not love this.

## Report 2 — Same customer, two referrals

> From: Priya (Ops)
>
> We found two referral records that look like the exact same customer request
> — same name, same phone, same price point, created about two minutes apart
> (see `lead-77401` in the seeded data). Both went through matching and both
> generated offers. The upstream platform team says their deliveries "may
> retry on timeout" and that this is expected behavior on their side.

## Report 3 — Two agents, one customer

> From: Riley (Ops)
>
> During Thursday's dry-run, two agents both called the same customer within
> ten minutes of each other. Both insist the app told them the claim
> succeeded. The customer asked why two different "assigned" agents were
> contacting them. The dashboard currently shows the referral (`lead-00011` in
> the seed) assigned to one of them, but both agents have screenshots of the
> success message.

## Report 4 — Referrals going quiet

> From: Priya (Ops)
>
> Several referrals just… stall. The first agent declines (or lets the offer
> expire) and then nothing happens — no new offers go out, and the referral
> sits in "offered" forever unless someone notices. `lead-00007`,
> `lead-00008`, and `lead-00009` in the seed are examples. Our target is an
> accepted claim within ten minutes, so a stalled referral is a missed
> referral.

## Report 5 — An agent's claim "succeeded" but the app said otherwise

> From: Marcus (Support)
>
> An agent claimed a referral and got the green success message, but then the
> card was gone and the referral never showed up in their assigned list. They
> only found out days later the customer had been contacted by nobody. No
> error, no email, nothing. This has happened at least twice.

## Report 6 — Dashboard is painfully slow

> From: Riley (Ops)
>
> Since we loaded the historical batch, the Operations dashboard takes several
> seconds to load — sometimes long enough that people assume it's broken and
> refresh, which makes it worse. It was instant when we only had a handful of
> referrals.

---

## Log excerpts

Fragments captured during dry-runs. Timestamps are from the staging
environment; they are excerpts, not complete traces.

**Upstream delivery retry (platform team confirmed retries are expected):**

```
INFO 2026-08-05 14:02:11 referrals.webhooks referral ingested: event_id=evt-9f21c external_id=lead-77401 offers=3
INFO 2026-08-05 14:04:12 referrals.webhooks referral ingested: event_id=evt-a03d7 external_id=lead-77401 offers=3
```

**Two claim requests close together:**

```
INFO 2026-08-07 16:41:03.118 django.server "POST /api/offers/812/claim/ HTTP/1.1" 200
INFO 2026-08-07 16:41:03.141 django.server "POST /api/offers/814/claim/ HTTP/1.1" 200
```

**Claim processed but something failed halfway (agent saw success in the UI):**

```
INFO 2026-08-07 11:22:40 django.server "POST /api/offers/641/claim/ HTTP/1.1" 500
ERROR 2026-08-07 11:22:40 django.request Internal Server Error: /api/offers/641/claim/
referrals.notifications.NotificationError: Gateway rejected recipient phone '555-0157 ext. TBD' for referral lead-00004
```

Ops note: the referral above shows as **assigned** on the dashboard, but its
event timeline has no `claim_succeeded` entry — the timeline just stops after
`claim_attempted`. We can't tell from the audit trail what actually happened.

**Slow dashboard request:**

```
INFO 2026-08-08 09:15:02 django.server "GET /api/ops/referrals/ HTTP/1.1" 200 (2.94s)
```

**Support ticket fragment (agent-reported, claim conflict):**

```
Agent report: "I hit Claim, it said 'claimed — nice work!', the card
disappeared. Then ops told me it belongs to someone else? The app never
showed me any error."
```
