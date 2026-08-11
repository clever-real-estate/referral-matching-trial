# Referral Matching Pilot Trial

## Scenario

Clever is preparing to pilot a new referral-matching workflow. The system
receives customer referrals, identifies eligible agents, ranks potential
matches, and allows an agent to claim a referral. Operations uses a dashboard
to monitor and intervene in the process.

The pilot's primary objective is to increase the number of qualified referrals
accepted by an eligible agent within ten minutes, without double assignments,
inappropriate disclosure, or loss of operational visibility.

Product and Operations have reported several concerns with the current
implementation — see [OPERATIONS_REPORTS.md](OPERATIONS_REPORTS.md).
Investigate the system and make the changes you believe most improve the
safety and success of the launch.

You are not expected to fix everything. Prioritize deliberately and leave the
application in a coherent state.

## Domain rules

An agent may receive or claim a referral only when **all** of the following
hold:

- The agent is active and not suspended.
- The agent is licensed in the referral's state.
- The referral is within the agent's service area.
- The referral falls within the agent's supported price range.
- The agent has available capacity.

Eligible agents are ranked by a combination of geographic fit, price-range
fit, recent performance, and current capacity. Eligibility is a hard
constraint; ranking chooses among eligible candidates.

Claiming rules:

- A referral may have at most one active owner.
- Offers expire ten minutes after they are sent.
- A declined or expired offer should allow the workflow to continue to another
  eligible agent.
- Operations may override an assignment; operations actions must remain
  visible and auditable.
- Upstream webhook deliveries may be repeated.

## Time box

Spend no more than four hours on the exercise. Additional work beyond the time
box will not improve your evaluation.

## AI usage

You may use any AI tools you normally use. You are responsible for
understanding and validating all submitted work. Be prepared to explain where
AI helped, where it was unreliable or wrong, and how you checked the result.

## Getting the code

You have been given read access to this private repository. **Do not fork it
and do not open pull requests or issues against it** — other candidates will
see this repository, so nothing about your solution may live here. Instead,
create a private copy of your own:

```bash
git clone --bare https://github.com/<org>/referral-matching-trial.git
cd referral-matching-trial.git
git push --mirror https://github.com/<your-username>/referral-trial-private.git
```

(Create `referral-trial-private` as a **private** repository first, then
invite the reviewers as collaborators: `@rymccue`, `@mikejaffe`, and
`@brianCTRL`.)

Work on a branch in your private copy and open the pull request there.
**Please keep your real commit history** — do not squash to a single commit;
the sequence of your commits is part of how we understand your prioritization.

## Submission

Submit, in your private repository:

1. A pull request containing your changes.
2. A short decision note (see
   [candidate_submission_template.md](candidate_submission_template.md))
   describing:
   - What you investigated
   - What you prioritized, and why
   - What you intentionally deferred
   - Important assumptions
   - How you validated your work
   - Where AI helped, where it was wrong or unreliable, and how you caught it
   - Remaining launch risks
3. Commands for running relevant tests.

Keep the decision note to approximately one page. After you submit, we will
schedule a conversation to walk through your work.
