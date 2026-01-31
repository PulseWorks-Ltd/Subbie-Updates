"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

function encodeError(message: string) {
  return encodeURIComponent(message);
}

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

export async function startCheckout(priceId?: string) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { orgs: { include: { org: true } } },
  });

  if (!user || user.orgs.length === 0) {
    redirect(`/billing?error=${encodeError("No organization found.")}`);
  }

  const org = user.orgs[0].org;

  const stripe = getStripe();
  let customerId = org.stripeId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: session.user.email,
      metadata: {
        orgId: org.id,
      },
    });
    customerId = customer.id;

    await prisma.org.update({
      where: { id: org.id },
      data: { stripeId: customerId },
    });
  }

  const price = priceId || process.env.STRIPE_PRICE_ID;
  if (!price) {
    redirect(`/billing?error=${encodeError("Missing Stripe price configuration.")}`);
  }

  const appUrl = getAppUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/billing?status=success`,
    cancel_url: `${appUrl}/billing?status=cancelled`,
    metadata: {
      orgId: org.id,
    },
  });

  if (!checkoutSession.url) {
    redirect(`/billing?error=${encodeError("Unable to start checkout.")}`);
  }

  redirect(checkoutSession.url);
}

export async function startCheckoutAction(_: FormData) {
  await startCheckout();
}

export async function startCheckoutWithPrice(priceId: string) {
  await startCheckout(priceId);
}

export async function openCustomerPortal() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { orgs: { include: { org: true } } },
  });

  if (!user || user.orgs.length === 0) {
    redirect(`/billing?error=${encodeError("No organization found.")}`);
  }

  const org = user.orgs[0].org;
  if (!org.stripeId) {
    redirect(`/billing?error=${encodeError("No billing profile yet.")}`);
  }

  const appUrl = getAppUrl();
  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeId,
    return_url: `${appUrl}/billing`,
  });

  redirect(portalSession.url);
}
