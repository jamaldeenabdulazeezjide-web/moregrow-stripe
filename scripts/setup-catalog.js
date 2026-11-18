// Creates (or reuses) Products and Prices from src/catalog.js. Safe to re-run.
// Usage: npm run setup:catalog   (optionally set PRODUCT_TAX_CODE=txcd_... after confirming it)
import { stripe } from '../src/stripeClient.js';
import { catalog, currency } from '../src/catalog.js';

const taxCode = process.env.PRODUCT_TAX_CODE; // pick from https://docs.stripe.com/tax/tax-codes — confirm with your tax advisor

for (const item of catalog) {
  const existing = await stripe.prices.list({ lookup_keys: [item.key], limit: 1 });
  if (existing.data.length) {
    console.log(`= ${item.key} already exists (${existing.data[0].id})`);
    continue;
  }
  const product = await stripe.products.create({
    name: item.name,
    description: item.description,
    ...(taxCode && { tax_code: taxCode }),
    metadata: { catalog_key: item.key },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency,
    unit_amount: item.amount,
    lookup_key: item.key,
    tax_behavior: 'exclusive', // tax added on top of the listed price
    ...(item.interval && { recurring: { interval: item.interval } }),
  });
  console.log(`+ ${item.key}: ${product.id} / ${price.id}`);
}
