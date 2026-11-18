# More Grow Global — Stripe integration

Payments, Invoicing and Tax for moregrowglobalsearch.com (WordPress + Elementor, HQ in Denver CO, clients in the US, Nigeria and elsewhere).

## Integration plan

Your sales flow is **consultation → quote → signed Client Service Agreement → work**. Stripe maps onto it like this:

| Need | Stripe product | How it's used here |
| --- | --- | --- |
| Fixed-price packages bought from the site | **Checkout Sessions** (Stripe-hosted page) | "Buy" buttons on `/services/` hit `/checkout?package=<key>` → Stripe Checkout. Cards, Apple/Google Pay, Link etc. shown automatically. |
| Custom quotes after a consultation | **Invoicing** | `npm run invoice` creates and emails an invoice with a hosted pay page. Can also be done by hand in the Dashboard. |
| Strategic Reverse Recruiting (monthly) | **Billing (subscription)** via Checkout | Monthly price; Stripe handles renewals and failed-payment retries. |
| Sales tax / VAT | **Stripe Tax** | `automatic_tax` on Checkout and invoices, switched on only after a registration exists. |
| Know when someone paid | **Webhooks** (required) | `/webhook` verifies Stripe's signature and triggers onboarding (agreement + intake form). Never rely on the thank-you page. |

### Phases
1. **Sandbox setup** — create a Stripe sandbox, a restricted key (`rk_test_…`), and run `setup:catalog` with your real prices.
2. **Checkout on the site** — deploy `src/server.js` with `render.yaml`, point Elementor buttons at `/checkout?package=<key>`. Customers return to `/start-your-project/`.
3. **Webhooks** — add the endpoint in Dashboard > Developers > Webhooks for: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `charge.dispute.created`. Wire `fulfill()` to your CRM/email.
4. **Invoicing** — use the script or Dashboard for custom quotes; turn on automatic reminders in Dashboard > Settings > Billing > Invoices.
5. **Tax** — see below, then set `STRIPE_TAX_ENABLED=true`.
6. **Go live** — repeat catalog/tax/webhook setup in live mode with a live restricted key, then run the [go-live checklist](https://docs.stripe.com/get-started/checklist/go-live.md).

### Tax — read before enabling
- Stripe Tax only collects where you have an **active registration** added in Stripe. With none, it silently collects $0.
- Steps: set the head office address (Dashboard > Tax > Settings) → confirm with your tax advisor where you must collect (Colorado's treatment of professional/career services, Nigeria VAT, any other states or countries) → add those registrations → pick a product tax code from the [tax code list](https://docs.stripe.com/tax/tax-codes) → run `npm run check:tax -- CO 80203 US` and confirm `taxability_reason` isn't `not_collecting`.
- Stripe's threshold monitoring (Dashboard > Tax > Locations) will flag other states as your US sales grow.
- Nigerian clients: Stripe accounts are opened by the US entity; Stripe Tax coverage for Nigeria should be checked on the [supported countries list](https://docs.stripe.com/tax/supported-countries.md).

## Run it

```bash
npm install
cp .env.example .env        # add a sandbox restricted key
npm run setup:catalog       # edit prices in src/catalog.js first
npm start
stripe listen --forward-to localhost:4242/webhook   # prints the whsec_ for .env
```

Invoice a client after a consultation:

```bash
npm run invoice -- client@example.com "Jane Doe" US CO 80203 executive_career_transformation cover_letter
```

### Restricted key permissions
Write: Products, Prices, Checkout Sessions, Customers, Invoices, Invoice Items. Read: Tax Settings, Tax Registrations, Tax Calculations (write). Webhook endpoints are configured in the Dashboard.

## Security
- Keys live in `.env` locally and in your host's secrets manager in production — never in WordPress, theme files or git.
- Use separate sandbox and live keys; rotate if anyone with access leaves.
- Turn on passkey/authenticator 2FA for all Dashboard users.

## Live packages and payment links

These work today without the server (no-code Stripe Payment Links). Each requires the Terms checkbox.

| Package (lookup key) | Price | Payment link |
| --- | --- | --- |
| Career Positioning Audit (`career_positioning_audit`) | $99 | https://buy.stripe.com/dRm9AU4B1fOH4lB62Ye7m01 |
| Professional Brand Transformation (`professional_brand_transformation`) | $295 | https://buy.stripe.com/9B69AUd7xaun7xNbnie7m00 |
| Executive Career Transformation (`executive_career_transformation`) | $495 | https://buy.stripe.com/eVq9AUd7xgSLf0f62Ye7m02 |
| Strategic Reverse Recruiting (`strategic_reverse_recruiting`) | $600/mo | https://buy.stripe.com/3cIcN62sTbyr5pF772e7m03 |
| Interview Coaching Session (`interview_coaching`) | $175 | https://book.stripe.com/6oU7sM7Nd0TNg4jgHCe7m04 |
| Professional Cover Letter (`cover_letter`) | $129 | https://buy.stripe.com/7sY9AUebBgSL3hxajee7m05 |

Customer portal ("Manage billing"): https://billing.stripe.com/p/login/9B69AUd7xaun7xNbnie7m00
