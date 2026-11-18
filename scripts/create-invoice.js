// Custom-quote invoicing: after a consultation, bill a client for the agreed services.
// Usage: npm run invoice -- client@email.com "Client Name" US CO 80203 resume_executive cover_letter
// Line items are catalog lookup keys. Stripe emails the invoice with a hosted pay page.
import { stripe, taxEnabled } from '../src/stripeClient.js';

const [email, name, country, state, postal_code, ...keys] = process.argv.slice(2);
if (!email || !keys.length) {
  console.error('Usage: npm run invoice -- <email> "<name>" <country> <state> <postal> <lookup_key> [lookup_key...]');
  process.exit(1);
}

// Reuse the customer if they already exist
const found = await stripe.customers.search({ query: `email:'${email.replace(/'/g, "\\'")}'`, limit: 1 });
const customer = found.data[0] ?? await stripe.customers.create({
  email, name,
  address: { country, state, postal_code }, // a saved address is required for automatic tax on invoices
});

const invoice = await stripe.invoices.create({
  customer: customer.id,
  collection_method: 'send_invoice',
  days_until_due: 7,
  automatic_tax: { enabled: taxEnabled },
  metadata: { source: 'consultation_quote' },
});

const prices = await stripe.prices.list({ lookup_keys: keys, limit: keys.length });
for (const price of prices.data) {
  await stripe.invoiceItems.create({ customer: customer.id, invoice: invoice.id, pricing: { price: price.id } });
}

const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
await stripe.invoices.sendInvoice(finalized.id);
console.log(`Invoice ${finalized.number} sent to ${email}: ${finalized.hosted_invoice_url}`);
console.log(`Total: ${(finalized.total / 100).toFixed(2)} ${finalized.currency.toUpperCase()} (tax: ${((finalized.total_taxes?.reduce((s, t) => s + t.amount, 0) ?? 0) / 100).toFixed(2)})`);
