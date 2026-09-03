import { randomBytes } from "node:crypto";
import type { Config } from "@netlify/functions";
import Stripe from "stripe";
import { availableSlots, database, minutesToTime, timeToMinutes, upsertCustomer } from "./_lib/db.mts";
import { body, cleanText, fail, json, requestOrigin, safeNumber, validDate, validTime } from "./_lib/http.mts";

type BookingInput = {
  serviceId?: unknown; addOnIds?: unknown; frequency?: unknown; propertyType?: unknown; bedrooms?: unknown; bathrooms?: unknown; squareFeet?: unknown;
  date?: unknown; time?: unknown; firstName?: unknown; lastName?: unknown; email?: unknown; phone?: unknown; address1?: unknown; address2?: unknown;
  city?: unknown; state?: unknown; postalCode?: unknown; accessNotes?: unknown; paymentChoice?: unknown; marketingConsent?: unknown; attribution?: unknown;
};

function confirmationCode() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `RV-${stamp}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export default async (request: Request) => {
  if (request.method !== "POST") return fail("Method not allowed.", 405);
  let bookingId = "";
  try {
    const input = await body<BookingInput>(request);
    const serviceId = cleanText(input.serviceId, 80);
    const addOnIds = Array.isArray(input.addOnIds) ? input.addOnIds.map((item) => cleanText(item, 80)).filter(Boolean).slice(0, 20) : [];
    const date = cleanText(input.date, 10);
    const time = cleanText(input.time, 5);
    const firstName = cleanText(input.firstName, 80);
    const lastName = cleanText(input.lastName, 80);
    const email = cleanText(input.email, 180).toLowerCase();
    const phone = cleanText(input.phone, 40);
    const address1 = cleanText(input.address1, 180);
    const address2 = cleanText(input.address2, 120);
    const city = cleanText(input.city, 100);
    const state = cleanText(input.state, 2).toUpperCase();
    const postalCode = cleanText(input.postalCode, 16);
    if (!serviceId || !validDate(date) || !validTime(time) || !firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email) || !phone || !address1 || !city || !/^[A-Z]{2}$/.test(state) || !postalCode) {
      return fail("Please complete the service, time, contact, and address fields.");
    }

    const availability = await availableSlots(date, serviceId, addOnIds);
    if (!availability.slots.some((slot) => slot.value === time && slot.available)) return fail("That appointment time is no longer available. Please choose another.", 409);
    const subtotalCents = availability.service.basePriceCents == null ? null : availability.service.basePriceCents + availability.addOns.reduce((sum, item) => sum + item.priceCents, 0);
    const wantsPayment = input.paymentChoice === "pay_now" && availability.config.paymentEnabled && subtotalCents != null && subtotalCents > 0;
    const startMinutes = timeToMinutes(time);
    const endTime = minutesToTime(startMinutes + availability.duration);
    const expiresAt = wantsPayment ? new Date(Date.now() + 30 * 60_000) : null;
    const code = confirmationCode();
    const attribution = typeof input.attribution === "object" && input.attribution ? input.attribution : {};
    const db = database();
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const customerId = await upsertCustomer(client, { firstName, lastName, email, phone, marketingConsent: Boolean(input.marketingConsent) });
      const inserted = await client.query(
        `INSERT INTO bookings (confirmation_code, customer_id, service_id, add_on_ids, frequency, property_type, bedrooms, bathrooms, square_feet,
          booking_date, start_time, end_time, timezone, address1, address2, city, state, postal_code, access_notes, status, payment_status,
          subtotal_cents, total_cents, expires_at, attribution)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'pending',$20,$21,$21,$22,$23::jsonb) RETURNING id`,
        [code, customerId, serviceId, addOnIds, cleanText(input.frequency, 40) || "one-time", cleanText(input.propertyType, 40) || "other",
          safeNumber(input.bedrooms, 0, 20, 0), safeNumber(input.bathrooms, 0, 20, 0), input.squareFeet ? safeNumber(input.squareFeet, 100, 100000, 0) : null,
          date, time, endTime, availability.config.timezone, address1, address2, city, state, postalCode, cleanText(input.accessNotes, 2000),
          wantsPayment ? "pending" : "not_required", subtotalCents, expiresAt, JSON.stringify(attribution)],
      );
      bookingId = String(inserted.rows[0].id);
      for (let minute = startMinutes; minute < startMinutes + availability.requiredMinutes; minute += availability.config.slotIntervalMinutes) {
        await client.query("INSERT INTO booking_slots (booking_date, slot_time, booking_id) VALUES ($1,$2,$3)", [date, minutesToTime(minute), bookingId]);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    if (!wantsPayment || subtotalCents == null) {
      return json({ bookingId, confirmationCode: code, paymentRequired: false, totalCents: subtotalCents, message: "Revive received your appointment request and will confirm the scope, price, and timing with you." }, 201);
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Secure checkout is not configured.");
    const percent = availability.config.depositPercent > 0 && availability.config.depositPercent < 100 ? availability.config.depositPercent : 100;
    const chargeCents = Math.max(50, Math.round(subtotalCents * percent / 100));
    const stripe = new Stripe(secretKey);
    const origin = requestOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      billing_address_collection: "required",
      line_items: [{ price_data: { currency: availability.config.currency, product_data: { name: `${availability.service.name}${percent < 100 ? ` – ${percent}% booking deposit` : ""}`, description: `${date} at ${time} · ${code}` }, unit_amount: chargeCents }, quantity: 1 }],
      automatic_tax: availability.config.taxEnabled ? { enabled: true } : undefined,
      metadata: { bookingId, confirmationCode: code, serviceId, bookingDate: date, bookingTime: time, serviceSubtotalCents: String(subtotalCents) },
      payment_intent_data: { metadata: { bookingId, confirmationCode: code } },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book?payment=cancelled&booking=${encodeURIComponent(bookingId)}`,
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    await db.pool.query("UPDATE bookings SET stripe_session_id=$1, updated_at=now() WHERE id=$2", [session.id, bookingId]);
    return json({ bookingId, confirmationCode: code, checkoutUrl: session.url, paymentRequired: true, totalCents: subtotalCents, message: "Your time is held for 30 minutes while payment is completed." }, 201);
  } catch (error) {
    console.error("bookings", error);
    if (bookingId) {
      try { await database().pool.query("DELETE FROM bookings WHERE id=$1 AND payment_status='pending'", [bookingId]); } catch (cleanupError) { console.error("booking cleanup", cleanupError); }
    }
    const conflict = String((error as { code?: string })?.code) === "23505";
    return fail(conflict ? "That appointment time was just booked. Please choose another." : "We could not complete the booking. Please try again or call (480) 582-5615.", conflict ? 409 : 503);
  }
};

export const config: Config = { path: "/api/bookings" };
