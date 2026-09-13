# TradeVision Commercial Launch Design

## Goal
Transform TradeVision from a restricted test PWA into a public freemium SaaS ready to acquire users and convert them to TradeVision Pro.

## Product model
- TradeVision Free: R$ 0, permanent access, maximum 20 operations per calendar month, essential dashboard and core metrics.
- TradeVision Pro: R$ 39,90/month, unlimited operations, complete history and advanced analytics already available in the product.
- The product remains an operations journal and performance analytics tool. It does not execute orders and does not provide investment recommendations.

## Public access
Remove the TradeVision-specific email allowlist requirement for normal public signup while retaining secure Aureon Base authentication and per-user data isolation. New users receive Free access by default. Existing authorized test users must keep their data and access.

## Entitlements
The backend is the source of truth for plan and entitlement. The frontend may display cached status but cannot grant Pro access itself.

Free entitlement:
- 20 newly created operations per calendar month.
- Existing operations remain readable after the monthly limit is reached.
- Core dashboard remains usable.
- Pro-only actions show an upgrade prompt rather than failing silently.

Pro entitlement:
- Unlimited operation creation while subscription is active.
- Full analytics and history.
- Existing performance features such as heatmap, setup/time analysis, curve, goals, daily stop and contract rules remain available.

Downgrade/cancellation never deletes trading data. The account returns to Free limits at the end of paid entitlement.

## Billing boundary
Billing must be server-authoritative and connected to Aureon Base. Payment success is confirmed by a trusted server-side event/webhook before Pro is granted. No checkout secret or payment credential may exist in the frontend.

The first release should expose a provider-neutral billing boundary so a checkout provider can be connected without coupling TradeVision analytics code to one vendor. The final provider and production credentials are operational configuration, not frontend code.

## UX
Add public account creation and a clear login/signup flow. Add a Plans/Upgrade experience that explains Free and Pro, current plan, monthly Free usage, upgrade CTA and subscription status. When a Free user reaches 20 operations, keep the app readable and direct creation attempts to upgrade.

## Account lifecycle
Support signup, login, logout, session refresh, password recovery/reset, current plan display and subscription state. Authentication errors must not reveal whether an unrelated email exists beyond what is required by the chosen auth flow.

## Security
- Aureon Base remains the backend/API boundary.
- User data remains isolated by authenticated user and project.
- Subscription and usage enforcement occurs on the server, not only in JavaScript.
- Frontend contains no database passwords, JWT signing secrets, provider secrets or webhook secrets.
- Rate-limit sensitive auth and billing endpoints.
- Validate webhook authenticity and make billing events idempotent.

## Migration
Preserve current operations/settings and current test account. Replace allowlist-based commercial access with plan entitlement. Existing valid accounts default safely to Free unless an active paid entitlement exists.

## Release acceptance
A release candidate is sellable only when these flows pass end-to-end:
1. New user signs up and logs in.
2. Free user can create operations 1 through 20 in a month.
3. Attempt 21 is rejected by the server and shows upgrade UX.
4. Successful paid checkout produces an authenticated server event and grants Pro.
5. Pro user can create more than 20 operations.
6. Cancelled/expired Pro returns to Free without deleting history.
7. Password recovery/reset works.
8. A user cannot read or mutate another user's operations/settings.
9. No frontend code can self-grant Pro.
10. PWA still installs/opens and existing analytics continue working.

## Launch sequence
Implement in slices: public auth -> server-side Free entitlement -> frontend plans/usage -> billing adapter/webhook -> password recovery -> end-to-end/security regression -> commercial landing/launch.
