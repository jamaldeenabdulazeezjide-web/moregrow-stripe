// Creates (or reuses) Products and Prices from src/catalog.js. Safe to re-run.
// Usage: npm run setup:catalog   (optionally set PRODUCT_TAX_CODE=txcd_... after confirming it)
import { stripe } from '../src/stripeClient.js';
import { catalog, currency } from '../src/catalog.js';

const taxCode = process.env.PRODUCT_TAX_CODE; // pick from https://docs.stripe.com/tax/tax-codes — confirm with your tax advisor

for (const item of catalog) {
  const existing = await stripe.prices.list({ lookup_keys: [item.key], limit: 1, expand: ['data.product'] });
  const current = existing.data[0];
  if (current && current.unit_amount === item.amount) {
    console.log(`= ${item.key} unchanged (${current.id})`);
    continue;
  }
  if (current) {
    // Prices can't be edited: create a new one, move the lookup key to it, archive the old one.
    const price = await stripe.prices.create({
      product: current.product.id,
      currency,
      unit_amount: item.amount,
      lookup_key: item.key,
      transfer_lookup_key: true,
      tax_behavior: 'exclusive',
      ...(item.interval && { recurring: { interval: item.interval } }),
    });
    await stripe.products.update(current.product.id, { default_price: price.id, name: item.name, description: item.description });
    await stripe.prices.update(current.id, { active: false });
    console.log(`~ ${item.key}: ${current.unit_amount} -> ${item.amount} (${price.id})`);
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
