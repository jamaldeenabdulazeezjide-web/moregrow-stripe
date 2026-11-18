import 'dotenv/config';
import Stripe from 'stripe';
import { HttpsProxyAgent } from 'https-proxy-agent';

if (!process.env.STRIPE_API_KEY) {
  throw new Error('STRIPE_API_KEY is not set. Copy .env.example to .env and add a sandbox key.');
}

// One client instance; the SDK pins the latest API version (2026-10-28.endive).
// Route through an outbound proxy when the host requires one (e.g. sandboxed dev environments).
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
export const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  ...(proxy && { httpAgent: new HttpsProxyAgent(proxy) }),
});

export const taxEnabled = process.env.STRIPE_TAX_ENABLED === 'true';
