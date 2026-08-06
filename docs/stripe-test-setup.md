# Stripe Test Mode Setup (Manual)

> Sprint 0 guide — no Stripe SDK is installed yet. These are the manual steps a
> developer follows once to get Stripe test-mode keys for local development and
> for CI. The Stripe integration (Checkout, Customer Portal, webhooks) lands in
> Sprint 4.

## 1. Create a Stripe account (test mode)

1. Go to <https://dashboard.stripe.com/register> and create an account.
2. Confirm the email. Stripe starts in **test mode** — the dashboard shows a
   `TEST MODE` toggle in the top-right corner. Keep it ON for development.

## 2. Copy the API keys

1. Open <https://dashboard.stripe.com/test/apikeys>.
2. You need two keys:
   - **Publishable key** (`pk_test_...`) — safe to expose client-side. Not used
     in Sprint 0; stored later when the Checkout SDK lands.
   - **Secret key** (`sk_test_...`) — server-only. NEVER commit it, NEVER put it
     in client code, NEVER share it.
3. Copy the secret key into your local `.env` as `STRIPE_SECRET_KEY` (see
   `.env.example` for the template).

## 3. Configure the webhook endpoint (for webhook-driven flows)

Webhooks are used by the Checkout/Customer Portal flows (Sprint 4). To prepare:

1. In test mode, go to <https://dashboard.stripe.com/test/webhooks> →
   **Add endpoint**.
2. URL: your local tunnel/ngrok URL + `/api/webhooks/stripe`
   (e.g. `https://your-tunnel.ngrok.app/api/webhooks/stripe`).
3. Select events (minimal set for subscription lifecycle):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. After creating the endpoint, copy the **Signing secret** (`whsec_...`) into
   your local `.env` as `STRIPE_WEBHOOK_SECRET`.

## 4. Test cards

Use the official test card numbers (never a real card) from
<https://docs.stripe.com/testing#cards>:

| Scenario            | Number          | Expiry   | CVC  |
|---------------------|-----------------|----------|------|
| Success             | `4242 4242 4242 4242` | any future | any  |
| Decline (generic)   | `4000 0000 0000 0002` | any future | any  |
| Insufficient funds  | `4000 0000 0000 9995` | any future | any  |

## 5. Env checklist

| Variable               | Where to get it                             | Example value      |
|------------------------|---------------------------------------------|--------------------|
| `STRIPE_SECRET_KEY`    | <https://dashboard.stripe.com/test/apikeys> | `sk_test_...`      |
| `STRIPE_WEBHOOK_SECRET`| Webhook endpoint signing secret             | `whsec_...`        |

## 6. Security rules (project convention)

- Only `sk_test_` and `whsec_` test-mode values go in local `.env` files.
- `.env` is gitignored (`.gitignore` has `.env*` + `!.env.example`).
- Production keys (`sk_live_`) are managed via the deploy platform's secret
  store (Vercel), never in the repo.
