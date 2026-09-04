CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name text NOT NULL DEFAULT 'Revive Co',
  business_phone text NOT NULL DEFAULT '(480) 582-5615',
  timezone text NOT NULL DEFAULT 'America/Phoenix',
  currency text NOT NULL DEFAULT 'usd',
  lead_time_hours integer NOT NULL DEFAULT 24 CHECK (lead_time_hours BETWEEN 0 AND 336),
  slot_interval_minutes integer NOT NULL DEFAULT 30 CHECK (slot_interval_minutes BETWEEN 15 AND 120),
  buffer_minutes integer NOT NULL DEFAULT 30 CHECK (buffer_minutes BETWEEN 0 AND 240),
  payment_enabled boolean NOT NULL DEFAULT false,
  tax_enabled boolean NOT NULL DEFAULT false,
  deposit_percent numeric(5,2) NOT NULL DEFAULT 25 CHECK (deposit_percent BETWEEN 0 AND 100),
  estimated_tax_rate numeric(5,2) NOT NULL DEFAULT 25 CHECK (estimated_tax_rate BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS business_hours (
  weekday smallint PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  enabled boolean NOT NULL DEFAULT true,
  open_time time NOT NULL DEFAULT '08:00',
  close_time time NOT NULL DEFAULT '17:00',
  CHECK (close_time > open_time)
);

INSERT INTO business_hours (weekday, enabled, open_time, close_time) VALUES
  (0, false, '09:00', '14:00'),
  (1, true, '08:00', '17:00'),
  (2, true, '08:00', '17:00'),
  (3, true, '08:00', '17:00'),
  (4, true, '08:00', '17:00'),
  (5, true, '08:00', '17:00'),
  (6, true, '09:00', '14:00')
ON CONFLICT (weekday) DO NOTHING;

CREATE TABLE IF NOT EXISTS blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamp NOT NULL,
  ends_at timestamp NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_description text NOT NULL,
  description text NOT NULL,
  base_price_cents integer CHECK (base_price_cents IS NULL OR base_price_cents >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 30 AND 1440),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO services (id, name, short_description, description, base_price_cents, duration_minutes, active, sort_order) VALUES
  ('standard-cleaning', 'Residential Cleaning', 'A dependable clean for the essential rooms in your home.', 'One-time or recurring residential cleaning tailored to the property.', NULL, 120, true, 1),
  ('deep-cleaning', 'Deep Cleaning', 'Extra time and attention for a more complete reset.', 'Detailed cleaning for buildup and areas that need more attention.', NULL, 210, true, 2),
  ('move-cleaning', 'Move-In / Move-Out', 'Empty-property detailing for a fresh handoff.', 'For renters, homeowners, real estate teams, and property managers.', NULL, 240, true, 3),
  ('commercial-cleaning', 'Commercial Cleaning', 'A custom plan for offices and professional spaces.', 'Flexible commercial care built around the property and operating schedule.', NULL, 180, true, 4),
  ('post-construction-cleaning', 'Post-Construction', 'Fine-dust and surface detailing after building work.', 'Renovation and new-construction cleanup for move-in-ready results.', NULL, 300, true, 5)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS add_ons (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes BETWEEN 0 AND 720),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO add_ons (id, name, price_cents, duration_minutes, active, sort_order) VALUES
  ('inside-oven', 'Inside Oven', 0, 30, true, 1),
  ('inside-refrigerator', 'Inside Refrigerator', 0, 30, true, 2),
  ('interior-windows', 'Interior Windows', 0, 45, true, 3),
  ('laundry-linens', 'Laundry / Linen Change', 0, 30, true, 4)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique ON customers (lower(email));

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_code text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  service_id text NOT NULL REFERENCES services(id),
  add_on_ids text[] NOT NULL DEFAULT '{}',
  frequency text NOT NULL,
  property_type text NOT NULL,
  bedrooms numeric(4,1) NOT NULL DEFAULT 0,
  bathrooms numeric(4,1) NOT NULL DEFAULT 0,
  square_feet integer,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL,
  address1 text NOT NULL,
  address2 text NOT NULL DEFAULT '',
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  access_notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  payment_status text NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required','pending','paid','failed','refunded')),
  subtotal_cents integer,
  tax_cents integer NOT NULL DEFAULT 0,
  total_cents integer,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  expires_at timestamptz,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date, start_time);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS bookings_created_idx ON bookings (created_at DESC);

CREATE TABLE IF NOT EXISTS booking_slots (
  booking_date date NOT NULL,
  slot_time time NOT NULL,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_date, slot_time)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL,
  vendor text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  tax_deductible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses (expense_date DESC);

CREATE TABLE IF NOT EXISTS analytics_events (
  id bigserial PRIMARY KEY,
  event_name text NOT NULL,
  action text,
  category text,
  label text,
  value integer,
  path text NOT NULL,
  anonymous_id text NOT NULL,
  source text NOT NULL DEFAULT 'direct',
  medium text NOT NULL DEFAULT 'none',
  campaign text NOT NULL DEFAULT 'none',
  landing_page text,
  referrer text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_occurred_idx ON analytics_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_anonymous_idx ON analytics_events (anonymous_id);
