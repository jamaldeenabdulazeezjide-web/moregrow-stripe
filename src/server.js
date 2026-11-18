import express from 'express';
import { stripe, taxEnabled } from './stripeClient.js';

const app = express();
const SITE = process.env.SITE_URL ?? 'http://localhost:4242';
const INTEGRATION_ID = 'mgg-website-checkout-qzvhlxpr';

// Webhook needs the raw body for signature verification — register it BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send('Invalid signature');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (session.payment_status !== 'unpaid') await fulfill(session.id, session.customer_details?.email, 'checkout');
        break;
      }
      case 'checkout.session.async_payment_failed':
        console.warn('Async payment failed for session', event.data.object.id);
        break;
      case 'invoice.paid': {
        const inv = event.data.object;
        await fulfill(inv.id, inv.customer_email, 'invoice');
        break;
      }
      case 'invoice.payment_failed':
        console.warn('Invoice payment failed:', event.data.object.id, event.data.object.customer_email);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription ended — stop LinkedIn management for', event.data.object.customer);
        break;
      case 'charge.dispute.created':
        console.warn('Dispute opened:', event.data.object.id);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Handler error', err);
    res.status(500).send('Handler error'); // Stripe will retry
  }
});

app.use(express.json());

// Your WordPress "Buy" buttons POST { lookup_key } here (or link to /checkout?package=...).
app.all('/checkout', express.urlencoded({ extended: false }), async (req, res) => {
  const lookupKey = req.body?.lookup_key ?? req.query.package;
  const { data: [price] } = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1, active: true });
  if (!price) return res.status(404).send('Unknown package');

  const session = await stripe.checkout.sessions.create({
    mode: price.recurring ? 'subscription' : 'payment',
    line_items: [{ price: price.id, quantity: 1 }],
    // No payment_method_types: Stripe shows the best methods per customer (cards, wallets, Link, etc.)
    automatic_tax: { enabled: taxEnabled },
    tax_id_collection: { enabled: true }, // lets corporate/B2B clients add a VAT/tax ID
    // Customer must tick "I agree to the Terms" (uses the Terms URL set in Stripe > Public details)
    consent_collection: { terms_of_service: 'required' },
    custom_text: {
      terms_of_service_acceptance: {
        message: 'I agree to the [Terms & Conditions](https://moregrowglobalsearch.com/terms-conditions/) and [Refund & Cancellation Policy](https://moregrowglobalsearch.com/refund-policy/).',
      },
    },
    ...(price.recurring ? {} : { customer_creation: 'always', invoice_creation: { enabled: true } }),
    success_url: `${SITE}/thank-you/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE}/services/`,
    integration_identifier: INTEGRATION_ID,
    metadata: { package: lookupKey },
  });
  res.redirect(303, session.url);
});

app.get('/health', (_req, res) => res.json({ ok: true, taxEnabled }));

// Idempotent fulfillment. Replace the Set with your DB/CRM (e.g. create a Zoho CRM deal + onboarding email).
const fulfilled = new Set();
async function fulfill(id, email, source) {
  if (fulfilled.has(id)) return;
  fulfilled.add(id);
  console.log(`FULFILL [${source}] ${id} -> send Client Service Agreement + intake form to ${email}`);
}

const port = process.env.PORT ?? 4242;
app.listen(port, () => console.log(`More Grow Global payments server on :${port} (tax ${taxEnabled ? 'ON' : 'OFF'})`));
