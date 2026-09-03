export type Service = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  basePriceCents: number | null;
  durationMinutes: number;
  active: boolean;
  sortOrder: number;
};

export type AddOn = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
};

export type BusinessHour = {
  weekday: number;
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

export type PublicConfig = {
  timezone: string;
  leadTimeHours: number;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  paymentEnabled: boolean;
  taxEnabled: boolean;
  depositPercent: number;
  services: Service[];
  addOns: AddOn[];
  hours: BusinessHour[];
};

export type TimeSlot = {
  value: string;
  label: string;
  available: boolean;
};

export type BookingPayload = {
  serviceId: string;
  addOnIds: string[];
  frequency: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  accessNotes: string;
  paymentChoice: "pay_now" | "pay_later";
  marketingConsent: boolean;
  attribution: Record<string, string>;
};

export type BookingResponse = {
  bookingId: string;
  confirmationCode: string;
  checkoutUrl?: string;
  paymentRequired: boolean;
  totalCents: number | null;
  message: string;
};

export type DashboardData = {
  summary: {
    grossRevenueCents: number;
    outstandingCents: number;
    expenseCents: number;
    netCents: number;
    estimatedTaxCents: number;
    bookings: number;
    customers: number;
    conversionRate: number;
  };
  revenueByDay: Array<{ day: string; revenueCents: number; bookings: number }>;
  bookingsByService: Array<{ name: string; count: number; revenueCents: number }>;
  recentBookings: AdminBooking[];
  rangeDays: number;
};

export type AdminBooking = {
  id: string;
  confirmationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  totalCents: number | null;
  createdAt: string;
  notes?: string;
};

export type Expense = {
  id: string;
  expenseDate: string;
  vendor: string;
  category: string;
  description: string;
  amountCents: number;
  taxDeductible: boolean;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lifetimeValueCents: number;
  lastBookingDate: string | null;
  createdAt: string;
};

export type Inquiry = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAt: string;
};

export type AdminSettings = PublicConfig & {
  estimatedTaxRate: number;
  businessName: string;
  businessPhone: string;
  currency: string;
  blockedTimes: Array<{ id: string; startsAt: string; endsAt: string; reason: string }>;
};
