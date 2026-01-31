import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { customer?: string; metadata?: { orgId?: string } };
    const orgId = session.metadata?.orgId;

    if (orgId && session.customer) {
      await prisma.org.update({
        where: { id: orgId },
        data: {
          stripeId: session.customer,
          plan: "AGENCY",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
