import type { Config } from "@netlify/functions";
import Stripe from "stripe";
import { database } from "./_lib/db.mts";

export default async (request: Request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!key || !webhookSecret || !signature) return new Response("Webhook is not configured", { status: 503 });
  try {
    const stripe = new Stripe(key);
    const event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")) {
      const paid = session.payment_status === "paid";
      await database().pool.query(
        `UPDATE bookings SET payment_status=$1, status=CASE WHEN $1='paid' THEN 'confirmed' ELSE status END,
          amount_paid_cents=$2, tax_cents=$3, stripe_payment_intent_id=$4, expires_at=NULL, updated_at=now() WHERE id=$5`,
        [paid ? "paid" : "pending", session.amount_total || 0, session.total_details?.amount_tax || 0,
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null, bookingId],
      );
    }
    if (bookingId && (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed")) {
      await database().pool.query("UPDATE bookings SET payment_status='failed', updated_at=now() WHERE id=$1", [bookingId]);
      await database().pool.query("DELETE FROM booking_slots WHERE booking_id=$1", [bookingId]);
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("stripe-webhook", error);
    return new Response("Invalid webhook", { status: 400 });
  }
};

export const config: Config = { path: "/api/stripe-webhook" };
