import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  if (!stripeClient) {
    const apiVersion = (process.env.STRIPE_API_VERSION ||
      "2026-01-28.clover") as Stripe.LatestApiVersion;
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion,
    });
  }

  return stripeClient;
}
