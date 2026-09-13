# TradeVision Commercial Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TradeVision a public freemium SaaS with a permanent Free plan and TradeVision Pro at R$ 39,90/month.

**Architecture:** Keep Aureon Base as the trusted authentication, data and entitlement boundary. TradeVision consumes server-authoritative account/plan/usage state and never self-grants Pro. Billing is integrated through a server-side adapter/webhook so checkout secrets never reach the PWA.

**Tech Stack:** Static HTML/CSS/JavaScript PWA, Aureon Base HTTP API, PostgreSQL/Neon backend, service worker.

**Spec:** `docs/superpowers/specs/2026-09-13-tradevision-commercial-launch-design.md`

## Global Constraints
- Free plan is permanent and permits at most 20 newly created operations per calendar month.
- Pro costs R$ 39,90/month and permits unlimited operations while active.
- Existing data is never deleted because of downgrade/cancellation.
- Backend is authoritative for plan, subscription and usage enforcement.
- No private database, JWT, checkout or webhook secrets in frontend code.
- TradeVision remains analytics/journaling software and must not claim to execute trades or provide investment recommendations.

---

### Task 1: Public authentication contract

**Files:**
- Modify: Aureon Base auth/project-access implementation (backend repository)
- Modify: `index.html`
- Modify: `app.js`
- Test: Aureon Base auth integration tests

**Interfaces:**
- Produces: public signup/login and `GET /projects/tradevision/access` returning authenticated plan/access state.

- [ ] Write backend tests proving a new valid email can register for TradeVision without `ALLOWED_EMAILS` and receives Free entitlement.
- [ ] Run tests and verify the current allowlist behavior fails the new test.
- [ ] Implement public registration while preserving authenticated per-user isolation and existing users.
- [ ] Add signup UI to `index.html` and client request handling to `app.js`; do not store credentials beyond the existing token/session mechanism.
- [ ] Run auth tests plus manual signup/login/logout smoke test.
- [ ] Commit with `feat: open TradeVision public signup`.

### Task 2: Server-authoritative Free usage limit

**Files:**
- Modify: Aureon Base TradeVision operations/access implementation
- Modify: `app.js`
- Test: Aureon Base TradeVision operation tests

**Interfaces:**
- Produces: access payload containing plan identifier, monthly operation usage, monthly limit and allowed state; operation creation rejects Free operation 21 with a stable entitlement error.

- [ ] Write tests: Free operations 1-20 succeed; operation 21 fails; reading history still succeeds; Pro operation 21 succeeds.
- [ ] Run tests and verify failure before implementation.
- [ ] Implement calendar-month usage calculation and server-side enforcement on operation creation.
- [ ] Extend the access response with `plan`, `usage.operations_month`, `limits.operations_month`, and subscription status while preserving existing fields consumed by TradeVision.
- [ ] Update `app.js` to render the server-returned usage and map the limit error to an upgrade prompt.
- [ ] Run backend tests and manually verify cached frontend state cannot bypass the server limit.
- [ ] Commit with `feat: enforce TradeVision Free limits`.

### Task 3: Plans, usage and upgrade UX

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`

**Interfaces:**
- Consumes: access payload from Task 2.
- Produces: Free/Pro plans UI, current-plan badge, monthly usage indicator and upgrade modal/CTA.

- [ ] Add a Plans/Account view with exact copy: `Free — R$ 0` and `Pro — R$ 39,90/mês`.
- [ ] Display `X de 20 operações este mês` for Free and `Operações ilimitadas` for active Pro.
- [ ] Make operation creation at the Free limit open the upgrade experience without hiding existing history.
- [ ] Add responsive styles and verify mobile and desktop layouts.
- [ ] Manually test Free below limit, Free at limit, Pro active and expired/cancelled states using backend fixtures/test accounts.
- [ ] Commit with `feat: add TradeVision plans and upgrade UX`.

### Task 4: Provider-neutral billing and Pro activation

**Files:**
- Modify/Create: Aureon Base billing adapter and webhook implementation
- Modify: `app.js`
- Test: Aureon Base billing tests

**Interfaces:**
- Produces: server-created checkout URL/session and authenticated/idempotent billing event handling that changes entitlement to Pro only after trusted payment confirmation.

- [ ] Write tests proving frontend requests cannot directly set `plan=pro` and invalid webhook signatures cannot change entitlement.
- [ ] Write tests for successful payment, duplicate webhook idempotency, cancellation/expiry and preservation of user data.
- [ ] Implement a provider-neutral checkout-session endpoint with product key `tradevision_pro_monthly` and amount configured server-side as R$ 39,90.
- [ ] Implement signed webhook validation, event-id idempotency and subscription state transitions on Aureon Base.
- [ ] Connect the Upgrade CTA in `app.js` only to the server-created checkout URL/session.
- [ ] Run billing/security tests and a sandbox end-to-end payment flow with the selected provider credentials configured only on the backend.
- [ ] Commit with `feat: activate TradeVision Pro through billing`.

### Task 5: Password recovery and account lifecycle

**Files:**
- Modify: Aureon Base auth recovery/reset implementation as needed
- Modify: `index.html`
- Modify: `app.js`
- Test: Aureon Base auth tests

**Interfaces:**
- Produces: password recovery request, secure reset flow, session invalidation/refresh behavior.

- [ ] Write tests for valid reset token, expired/used token and session behavior after password change.
- [ ] Implement/verify recovery and reset endpoints without exposing secrets in URLs longer than required by the reset flow.
- [ ] Add `Esqueci minha senha` and reset UI to TradeVision.
- [ ] Test recovery, reset, login with new password and failure with old credentials.
- [ ] Commit with `feat: complete TradeVision account recovery`.

### Task 6: Security and regression release gate

**Files:**
- Modify: affected TradeVision/Aureon Base files only when failures are found
- Test: backend auth, project isolation, operations, billing and frontend smoke tests

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified release candidate.

- [ ] Run the complete Aureon Base test suite and TradeVision smoke tests.
- [ ] Verify user A cannot read/update/delete user B operations or settings.
- [ ] Verify a Free user cannot bypass the 20-operation limit through direct API calls or modified localStorage.
- [ ] Verify no frontend source contains database passwords, JWT signing secrets, checkout private keys or webhook secrets.
- [ ] Verify signup, login, logout, password recovery, Free limit, upgrade, Pro activation, cancellation/expiry and PWA install/open flows.
- [ ] Verify analytics already documented for TradeVision still render with existing operation data.
- [ ] Commit any release-gate fixes with focused messages and rerun the failed test plus full suite.

### Task 7: Commercial release surface

**Files:**
- Modify: `README.md`
- Modify: `index.html` or create a dedicated public landing entry if routing requires separation
- Modify: `styles.css`

**Interfaces:**
- Produces: public product explanation, pricing and CTA into signup/upgrade.

- [ ] Add concise product positioning focused on journal + performance intelligence.
- [ ] Publish Free and Pro comparison with Pro price R$ 39,90/month.
- [ ] Include the explicit disclaimer that TradeVision does not execute orders and is not investment advice/recommendation.
- [ ] Add CTA to create a Free account and a secondary CTA to view Pro.
- [ ] Test all links and mobile layout.
- [ ] Update README from restricted-test language to public freemium architecture after production release is verified.
- [ ] Commit with `docs: prepare TradeVision commercial release`.

## Release Definition of Done
- Public signup works.
- Free plan is permanent and enforced at 20 operations/month on the backend.
- Pro R$ 39,90/month is activated only from trusted billing confirmation.
- Password recovery works.
- Cancellation/expiry does not delete history.
- Cross-user isolation and billing security tests pass.
- Existing TradeVision analytics and PWA behavior regressions pass.
- Public pricing/CTA and product disclaimer are visible.
