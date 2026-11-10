export type DashboardData = {
  summary: {
    grossRevenueCents: number;
    outstandingCents: number;
    expenseCents: number;
    bookings: number;
    customers: number;
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
