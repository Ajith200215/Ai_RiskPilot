# RiskPilot — Phased Build Spec (Razorpay AI Builder Internship Project)

Feed ONE phase at a time into Claude Code / Cursor. Do not paste the whole file in
one prompt — build, run, and fix each phase before moving to the next.

Tech stack: Next.js 14 (App Router, TypeScript) · Tailwind + shadcn/ui · Tremor
(charts) · Supabase (Postgres) · Prisma · Anthropic API (Claude, tool use) ·
Faker.js · Vitest · Vercel (deploy)

---

## Phase 0 — Scaffold

Set up a Next.js 14 App Router project with TypeScript and Tailwind. Install
and initialize shadcn/ui. Install Prisma, @faker-js/faker, @anthropic-ai/sdk,
zustand, tremor, vitest. Set up a `.env.local` with placeholders for
DATABASE_URL and ANTHROPIC_API_KEY. Create a basic app shell with a left
sidebar nav (Dashboard, Transactions, Simulation Center, AI Assistant, Risk
Engine Tests) and a topbar showing "DEMO ENVIRONMENT — SYNTHETIC DATA ONLY".

## Phase 1 — Data model

Use this exact Prisma schema: [paste the schema from chat]. Run migrations
against a Supabase Postgres instance. Generate the Prisma client. Add a
`lib/db.ts` singleton Prisma client following Next.js best practices
(avoid multiple instances in dev with hot reload).

## Phase 2 — Synthetic data generator

Create `lib/generateTransaction.ts`. It should accept a profile type:
"normal" | "suspicious" | "high-risk" | "random", and generate a full
synthetic Customer + Merchant + Transaction using Faker, matching these
scenario definitions:

- normal: amount 500–3000, account age 1-3 years, known device, 0 failed
  attempts, normal location
- suspicious: amount 15000-30000, account age 1-6 months, new device,
  1-2 failed attempts, location anomaly possible
- high-risk: amount 50000-100000, account age under 1 hour, new device,
  4-6 failed attempts, location anomaly true

Also implement bulk generation: generate(N) that produces a realistic mix
(60% normal, 25% suspicious, 15% high-risk) and inserts into the DB via
Prisma.

## Phase 3 — Risk engine (pure function)

Create `lib/riskEngine.ts` using this exact function: [paste calculateRiskScore
from chat]. Keep it pure/testable — no DB or API calls inside it. Wire it into
an API route `POST /api/transactions/[id]/analyze` that reads the transaction
+ customer + merchant from the DB, runs calculateRiskScore, and writes the
resulting RiskFactor rows and updates riskScore/riskLevel on the transaction.

## Phase 4 — Automated test suite

Using Vitest, write tests in `lib/riskEngine.test.ts` covering these 10 cases
against calculateRiskScore, asserting the resulting risk level matches:

1. Normal transaction → LOW
2. New account + large payment → HIGH
3. New device + location anomaly → MEDIUM or HIGH
4. Multiple failed attempts (4+) → HIGH
5. Normal returning customer, moderate amount → LOW
6. High-risk merchant (merchantRiskScore 80+) → HIGH
7. Sudden spending spike (10x average) → HIGH
8. High refund merchant reflected via merchantRiskScore → HIGH
9. High chargeback merchant reflected via merchantRiskScore → HIGH
10. Multiple signals combined (new device + new account + high amount) → HIGH

Then build a `/risk-engine-tests` page that runs these same cases (or reads
stored results) and displays pass/fail with a summary: Tests Passed X/10,
Success Rate. Style it like a professional test dashboard, not a raw log.

## Phase 5 — Dashboard UI

Build `/dashboard` using Tremor components: stat cards (total transactions
today, low/medium/high risk counts, blocked, approved, manual reviews), a
risk distribution donut chart, a risk trend line chart, and a transactions
table (Transaction ID, Amount, Customer, Merchant, Risk Score, Risk Level
badge, Status, Timestamp) with color-coded risk level badges (green/amber/red).
Data comes from Prisma queries in a server component.

## Phase 6 — AI Investigation layer

Create `lib/aiInvestigate.ts`. Given a transaction + its risk factors, call
the Anthropic API (model claude-sonnet-4-6) using tool use / a JSON schema
to force structured output:

```
{
  investigationSummary: string,   // 2-4 sentence natural language explanation
  recommendation: "APPROVE" | "ALLOW_WITH_MONITORING" | "REQUEST_VERIFICATION"
                  | "MANUAL_REVIEW" | "HOLD" | "BLOCK",
  confidence: number,             // 0-100
  reasoning: string
}
```

System prompt: "You are a fintech risk analyst AI. You are given a
transaction's risk score and risk factors. Do not invent facts not present in
the data. Distinguish between clearly normal, potentially suspicious, high
risk, and likely fraudulent. Explain your reasoning in plain language a human
analyst would trust." Store the result in the Investigation table.

## Phase 7 — Transaction detail / investigation page

Build `/transactions/[id]`. Sections top to bottom: Transaction Details,
Risk Score (big number + level badge), Risk Score Breakdown (bar chart of
factor contributions), Risk Factors (cards with severity + evidence), AI
Investigation (summary + reasoning from Claude), Recommendation (action +
confidence), then four buttons: Approve / Review / Hold / Block that write
to the Decision table and mark overriddenByAnalyst=true if it differs from
the AI's recommendation.

## Phase 8 — Simulation Center

Build `/simulation`. Buttons: Generate Normal / Suspicious / High-Risk /
Random Transaction (calls Phase 2 generator + Phase 3 analyze + Phase 6
investigate, then redirects to the transaction detail page). Also implement
the 8 predefined scenarios from the original spec as named buttons, each
showing its expected outcome and highlighting whether the actual result
matched. Add bulk generation buttons (100 / 1,000 transactions) that populate
the dashboard.

## Phase 9 — AI Chat Assistant

Build `/assistant`. A chat UI where the user asks questions like "Why was
transaction X flagged?" or "Show today's high-risk transactions". On each
message: query Postgres for relevant transactions/stats based on the
question (simple keyword/ID matching is fine for MVP), pass that data plus
the question to Claude with instructions to answer only from the provided
data and say so if the data doesn't contain the answer. Stream the response.

## Phase 10 — Polish + deploy

Add loading states, empty states, and mobile-responsive layout checks.
Deploy to Vercel with Supabase connection pooling configured correctly for
serverless. Record a 2-3 minute walkthrough: Simulation Center → generate
high-risk transaction → detail page walkthrough → AI investigation →
override decision → dashboard update → Risk Engine Tests passing 10/10.

---

## Phase 11 — Risk Timeline (extension)

Add an `Event` model to Prisma: id, transactionId (nullable), customerId
(nullable), merchantId (nullable), type (string, e.g. "ACCOUNT_CREATED",
"DEVICE_DETECTED", "PAYMENT_FAILED", "PAYMENT_SUCCESS", "RISK_SCORED",
"INVESTIGATION_STARTED", "DECISION_MADE"), label (string, human-readable),
createdAt. Emit an Event row at each meaningful step already happening in
Phases 2-3-6-7 (account creation during synthetic generation, each failed
attempt, risk scoring, investigation start/finish, final decision) instead
of adding new logic — this phase is mostly instrumentation of existing
flows. Build a timeline component (vertical list, timestamp + icon + label)
and embed it on both the transaction detail page and a new `/customers/[id]`
page showing that customer's full event history across transactions.

## Phase 12 — Merchant Risk Analyzer (extension)

Build `/merchants` (list view: name, category, risk score badge, refund
rate, chargeback rate, transaction volume) and `/merchants/[id]` (detail
view). Create `lib/merchantRiskEngine.ts` — a pure function mirroring the
transaction risk engine's shape (score + factors + evidence) but scoring on
merchant-level signals: domain age, refund rate, chargeback rate, missing
business info flags, and transaction volume growth rate. Reuse the same
RiskFactor-style output shape from Phase 3 so the UI (score breakdown,
factor cards) can be shared between transaction and merchant detail pages
rather than rebuilt.

Add an AI merchant investigation step reusing the Phase 6 pattern: same
Anthropic tool-use call shape, but the system prompt shifts to a merchant
reviewer persona and recommendation options become APPROVE_MERCHANT /
MONITOR / REQUEST_MORE_INFO / MANUAL_REVIEW / RESTRICT / SUSPEND. Wire the
existing `merchantRiskScore` input in the transaction risk engine (Phase 3)
to actually pull from this new merchant score instead of a placeholder.

## Phase 13 — Alert System (extension)

Add an `Alert` model: id, type (string, e.g. "HIGH_RISK_TRANSACTION",
"MERCHANT_RISK_INCREASED", "TRANSACTION_SPIKE", "MULTIPLE_FAILED_PAYMENTS",
"HIGH_CHARGEBACK_RATE"), severity, message, relatedTransactionId (nullable),
relatedMerchantId (nullable), isRead (boolean, default false), createdAt.
Trigger alert creation from existing logic with no new detection work: when
Phase 3's risk engine returns HIGH for a transaction, when Phase 12's
merchant engine crosses a risk threshold, and when N failed attempts happen
in a short window for the same customer (simple count query, no new
infra). Build a bell icon in the topbar with unread count, a dropdown
list, and a full `/alerts` page. Each alert card shows: what happened, why
it matters (pull the top contributing risk factor as the reason), severity
badge, and a link to the related transaction/merchant.
