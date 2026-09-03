import type { Config } from "@netlify/functions";
import Stripe from "stripe";
import { database } from "./_lib/db.mts";
import { fail, json } from "./_lib/http.mts";

export default async (request: Request) => {
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  const sessionId = new URL(request.url).searchParams.get("session_id") || "";
  if (!/^cs_(test_|live_)/.test(sessionId)) return fail("Invalid payment session.");
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return fail("Secure checkout is not configured.", 503);
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return fail("Payment has not been completed yet.", 402);
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return fail("Booking metadata is missing.", 404);
    const db = database();
    await db.pool.query(
      `UPDATE bookings SET payment_status='paid', status='confirmed', amount_paid_cents=$1, tax_cents=$2,
        stripe_payment_intent_id=$3, expires_at=NULL, updated_at=now() WHERE id=$4`,
      [session.amount_total || 0, session.total_details?.amount_tax || 0, typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null, bookingId],
    );
    const result = await db.pool.query(
      `SELECT b.confirmation_code, c.first_name, c.last_name, s.name service_name, b.booking_date, b.start_time, b.payment_status, b.amount_paid_cents
       FROM bookings b JOIN customers c ON c.id=b.customer_id JOIN services s ON s.id=b.service_id WHERE b.id=$1`, [bookingId],
    );
    if (!result.rows[0]) return fail("Booking not found.", 404);
    const row = result.rows[0];
    return json({ confirmationCode: row.confirmation_code, customerName: `${row.first_name} ${row.last_name}`, serviceName: row.service_name,
      bookingDate: String(row.booking_date).slice(0, 10), startTime: String(row.start_time).slice(0, 5), paymentStatus: row.payment_status, totalCents: Number(row.amount_paid_cents) });
  } catch (error) {
    console.error("payment-status", error);
    return fail("We could not verify this payment. Please contact Revive with your receipt.", 503);
  }
};

export const config: Config = { path: "/api/payment-status" };
