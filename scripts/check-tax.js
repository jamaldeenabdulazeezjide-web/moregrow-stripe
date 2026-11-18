// Read-only Stripe Tax health check. Run before setting STRIPE_TAX_ENABLED=true.
// Usage: npm run check:tax -- [state] [postal_code] [country]   e.g. npm run check:tax -- CO 80203 US
import { stripe } from '../src/stripeClient.js';

const [state = 'CO', postal = '80203', country = 'US'] = process.argv.slice(2);

const settings = await stripe.tax.settings.retrieve();
console.log('Tax settings status:', settings.status, settings.status === 'pending' ? '(set head office address in Dashboard > Tax > Settings)' : '');
console.log('Head office:', settings.head_office?.address ?? 'not set');
console.log('Preset tax code:', settings.defaults?.tax_code ?? 'none');

const regs = await stripe.tax.registrations.list({ status: 'active', limit: 100 });
console.log(`Active registrations: ${regs.data.length}`);
for (const r of regs.data) console.log(`  - ${r.country}${r.country_options?.[r.country.toLowerCase()]?.state ? ' / ' + r.country_options[r.country.toLowerCase()].state : ''} (${r.country_options?.[r.country.toLowerCase()]?.type ?? ''})`);
if (!regs.data.length) console.log('  ! No active registrations: automatic tax will collect $0 everywhere.');

if (settings.status === 'active') {
  const calc = await stripe.tax.calculations.create({
    currency: 'usd',
    line_items: [{ amount: 19900, reference: 'resume_professional', ...(process.env.PRODUCT_TAX_CODE && { tax_code: process.env.PRODUCT_TAX_CODE }) }],
    customer_details: { address: { country, state, postal_code: postal }, address_source: 'billing' },
  });
  console.log(`\nTest calculation for ${country}/${state}/${postal}: tax = ${calc.tax_amount_exclusive} cents`);
  for (const b of calc.tax_breakdown) console.log(`  taxability_reason: ${b.taxability_reason}`);
  if (calc.tax_breakdown.some(b => b.taxability_reason === 'not_collecting')) {
    console.log('  ! not_collecting = no registration here, or a Nontaxable tax code. Not ready.');
  }
}
