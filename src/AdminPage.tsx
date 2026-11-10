import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api, formatMoney } from "./api";
import type { AdminBooking, Customer, DashboardData, Expense, Inquiry } from "./types";

type AdminSession = { authenticated: boolean; email?: string };
type AnalyticsData = {
  totals: { pageViews: number; bookingClicks: number; contactClicks: number; phoneClicks: number };
  channels: Array<{ source: string; sessions: number; bookingClicks: number }>;
  topPages: Array<{ path: string; views: number }>;
};

const navItems = [
  ["overview", "Legacy Overview"],
  ["bookings", "Legacy Bookings"],
  ["inquiries", "Legacy Inquiries"],
  ["availability", "BookingKoala Cutover"],
  ["customers", "Legacy Customers"],
  ["expenses", "Expense Ledger"],
  ["analytics", "Analytics"],
] as const;

function AdminLogin({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const session = await api.post<AdminSession>("/api/admin-login", { email: form.get("email"), password: form.get("password") });
      onLogin(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-art">
        <a href="/" className="admin-brand"><img src="/images/revive-homeservices-logo-compact.png" alt="Revive Co" width="320" height="320" /></a>
        <div><p className="eyebrow">Historical Operations Portal</p><h1>Your Records.<br />Your Numbers.<br /><em>One Clean View.</em></h1><p>Historical website records, first-party host analytics, and a separate expense ledger. Current bookings, customers, and revenue are managed in BookingKoala.</p></div>
        <p className="admin-credit">Platform by <a href="https://salesvisionconsulting.com">Sales Vision Consulting</a></p>
      </div>
      <div className="admin-login-panel">
        <form onSubmit={submit}>
          <span className="admin-lock" aria-hidden="true">◇</span>
          <p className="eyebrow">Welcome Back</p>
          <h2>Sign In to Revive.</h2>
          <p>Use the administrator credentials configured for this website.</p>
          <label>Email<input name="email" type="email" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p className="form-status error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={loading}>{loading ? "Signing In…" : "Sign In Securely"}</button>
          <a href="/">← Return to Website</a>
        </form>
      </div>
    </main>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function StatusPill({ value }: { value: string }) {
  return <span className={`status-pill status-${value.replaceAll("_", "-")}`}>{value.replaceAll("_", " ")}</span>;
}

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof navItems)[number][0]>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("all");

  const loadData = useCallback(async (days: number) => {
    setLoading(true);
    setError("");
    try {
      const [dashboardData, bookingData, inquiryData, customerData, expenseData, analyticsData] = await Promise.all([
        api.get<DashboardData>(`/api/admin-dashboard?range=${days}`),
        api.get<{ bookings: AdminBooking[] }>("/api/admin-bookings"),
        api.get<{ inquiries: Inquiry[] }>("/api/admin-inquiries"),
        api.get<{ customers: Customer[] }>("/api/admin-customers"),
        api.get<{ expenses: Expense[] }>(`/api/admin-expenses?range=${days}`),
        api.get<AnalyticsData>(`/api/admin-analytics?range=${days}`),
      ]);
      setDashboard(dashboardData);
      setBookings(bookingData.bookings);
      setInquiries(inquiryData.inquiries);
      setCustomers(customerData.customers);
      setExpenses(expenseData.expenses);
      setAnalytics(analyticsData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get<AdminSession>("/api/admin-session")
      .then((data) => {
        setSession(data);
        if (data.authenticated) void loadData(30);
        else setLoading(false);
      })
      .catch(() => { setSession({ authenticated: false }); setLoading(false); });
  }, [loadData]);

  const logout = async () => {
    await api.post("/api/admin-logout");
    setSession({ authenticated: false });
  };

  const refreshRange = (days: number) => {
    setRange(days);
    void loadData(days);
  };

  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    const matchesStatus = bookingFilter === "all" || booking.status === bookingFilter;
    const query = bookingSearch.toLowerCase();
    const matchesSearch = !query || `${booking.customerName} ${booking.customerEmail} ${booking.customerPhone} ${booking.confirmationCode} ${booking.serviceName}`.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  }), [bookings, bookingFilter, bookingSearch]);

  const addExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const expense = await api.post<Expense>("/api/admin-expenses", { ...data, taxDeductible: data.taxDeductible === "on" });
      setExpenses((current) => [expense, ...current]);
      event.currentTarget.reset();
      setNotice("Expense saved.");
      void loadData(range);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save expense."); }
  };

  const removeExpense = async (id: string) => {
    try {
      await api.delete("/api/admin-expenses", { id });
      setExpenses((current) => current.filter((expense) => expense.id !== id));
      setNotice("Expense removed.");
      void loadData(range);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to remove expense."); }
  };

  if (loading && session == null) return <div className="admin-loading">Loading Revive operations…</div>;
  if (!session?.authenticated) return <AdminLogin onLogin={(authenticated) => { setSession(authenticated); void loadData(range); }} />;

  const maxRevenue = Math.max(...(dashboard?.revenueByDay.map((item) => item.revenueCents) || [1]), 1);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-logo" href="/"><img src="/images/revive-homeservices-logo-compact.png" alt="Revive Co" width="320" height="320" /></a>
        <nav aria-label="Admin navigation">
          {navItems.map(([id, label]) => <button type="button" key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}><span aria-hidden="true">{id === "overview" ? "⌂" : id === "bookings" ? "▣" : id === "inquiries" ? "✉" : id === "availability" ? "◷" : id === "customers" ? "◎" : id === "expenses" ? "$" : "↗"}</span>{label}</button>)}
        </nav>
        <div className="admin-sidebar-footer"><span>Signed In</span><strong>{session.email}</strong><button type="button" onClick={logout}>Sign Out</button><small>Sales Vision Platform</small></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><p className="panel-kicker">Revive Co Operations</p><h1>{navItems.find(([id]) => id === activeTab)?.[1]}</h1></div>
          <div className="admin-top-actions"><select value={range} onChange={(e) => refreshRange(Number(e.target.value))} aria-label="Reporting period"><option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option><option value={365}>Last Year</option></select><a className="button button-small" href="/book" target="_blank" rel="noopener noreferrer">Open Booking Form ↗</a></div>
        </header>
        <div className="admin-alert admin-cutover" role="note">
          <div><strong>BookingKoala is the active booking system.</strong><p>Booking, inquiry, customer, and revenue records shown here are historical website data only. Manage current operations in BookingKoala.</p></div>
        </div>
        {error && <div className="admin-alert error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {notice && <div className="admin-alert success" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
        {loading && <div className="admin-loading inline">Refreshing dashboard…</div>}

        {!loading && activeTab === "overview" && dashboard && (
          <section className="admin-section">
            <div className="metric-grid">
              <MetricCard label="Legacy collected revenue" value={formatMoney(dashboard.summary.grossRevenueCents)} note={`${dashboard.rangeDays}-day historical gross`} />
              <MetricCard label="Legacy active bookings" value={String(dashboard.summary.bookings)} note="Historical appointments in range" />
              <MetricCard label="Legacy customers" value={String(dashboard.summary.customers)} note="Historical website customer records" />
              <MetricCard label="Expense ledger" value={formatMoney(dashboard.summary.expenseCents)} note="Separate from BookingKoala revenue" />
            </div>
            <div className="dashboard-grid">
              <article className="admin-card revenue-chart-card">
                <div className="card-heading"><div><span>Revenue</span><h2>Payments by Day</h2></div><strong>{formatMoney(dashboard.summary.grossRevenueCents)}</strong></div>
                <div className="revenue-chart" aria-label="Revenue by day">
                  {dashboard.revenueByDay.map((item) => <div key={item.day} title={`${item.day}: ${formatMoney(item.revenueCents)}`}><span style={{ height: `${Math.max(3, (item.revenueCents / maxRevenue) * 100)}%` }} /><small>{item.day.slice(5)}</small></div>)}
                </div>
              </article>
              <article className="admin-card service-performance">
                <div className="card-heading"><div><span>Mix</span><h2>Bookings by Service</h2></div></div>
                <div>{dashboard.bookingsByService.length === 0 && <p className="admin-empty">No historical completed bookings in this period.</p>}{dashboard.bookingsByService.map((service) => <div key={service.name}><span><strong>{service.name}</strong><small>{service.count} booking{service.count === 1 ? "" : "s"}</small></span><b>{formatMoney(service.revenueCents)}</b></div>)}</div>
              </article>
            </div>
            <article className="admin-card table-card">
              <div className="card-heading"><div><span>Schedule</span><h2>Recent Bookings</h2></div><button type="button" onClick={() => setActiveTab("bookings")}>View All →</button></div>
              <BookingTable bookings={dashboard.recentBookings} />
            </article>
          </section>
        )}

        {!loading && activeTab === "bookings" && (
          <section className="admin-section">
            <div className="admin-toolbar"><input value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} placeholder="Search customer, service or confirmation" aria-label="Search bookings" /><select value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)} aria-label="Filter booking status"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <article className="admin-card table-card"><div className="card-heading"><div><span>Historical Appointments</span><h2>{filteredBookings.length} Bookings</h2></div></div><BookingTable bookings={filteredBookings} /></article>
          </section>
        )}

        {!loading && activeTab === "inquiries" && (
          <section className="admin-section">
            <article className="admin-card table-card">
              <div className="card-heading"><div><span>Lead Inbox</span><h2>{inquiries.length} Inquiries</h2></div></div>
              <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Service</th><th>Message</th><th>Received</th><th>Status</th></tr></thead><tbody>{inquiries.map((inquiry) => <tr key={inquiry.id}><td><strong>{inquiry.customerName}</strong><small><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a><br /><a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a></small></td><td>{inquiry.service.replaceAll("-", " ")}</td><td className="message-cell">{inquiry.message}</td><td>{new Date(inquiry.createdAt).toLocaleDateString()}</td><td><StatusPill value={inquiry.status} /></td></tr>)}</tbody></table>{inquiries.length === 0 && <p className="admin-empty">No historical website inquiries are stored.</p>}</div>
            </article>
          </section>
        )}

        {!loading && activeTab === "availability" && (
          <section className="admin-section">
            <article className="admin-card settings-card">
              <div className="card-heading"><div><span>System of Record</span><h2>BookingKoala Is Now Active.</h2></div></div>
              <p className="card-intro">Availability, services, pricing, extras, payments, taxes, providers, and notifications are now configured in BookingKoala. The retired website settings are no longer exposed here, preventing two systems from drifting out of sync.</p>
              <a className="button" href="/book" target="_blank" rel="noopener noreferrer">Open Customer Booking Form ↗</a>
            </article>
          </section>
        )}

        {!loading && activeTab === "customers" && (
          <section className="admin-section"><article className="admin-card table-card"><div className="card-heading"><div><span>Historical CRM</span><h2>{customers.length} Customers</h2></div></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Phone</th><th>Bookings</th><th>Lifetime value</th><th>Last service</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong><small>{customer.email}</small></td><td>{customer.phone}</td><td>{customer.totalBookings}</td><td>{formatMoney(customer.lifetimeValueCents)}</td><td>{customer.lastBookingDate || "—"}</td></tr>)}</tbody></table>{customers.length === 0 && <p className="admin-empty">No historical website customers are stored.</p>}</div></article></section>
        )}

        {!loading && activeTab === "expenses" && dashboard && (
          <section className="admin-section">
            <div className="metric-grid metric-grid-3"><MetricCard label="Expenses logged" value={formatMoney(dashboard.summary.expenseCents)} note={`${dashboard.rangeDays}-day total`} /><MetricCard label="Entries in view" value={String(expenses.length)} note="Current filtered ledger entries" /><MetricCard label="Revenue source" value="BookingKoala" note="Not combined with this ledger" /></div>
            <p className="card-intro">This expense ledger is intentionally separate from BookingKoala revenue. Use an accounting system or reconciled export for profit and tax reporting.</p>
            <div className="expense-grid"><article className="admin-card settings-card"><div className="card-heading"><div><span>Manual Entry</span><h2>Add Expense</h2></div></div><form className="expense-form" onSubmit={addExpense}><label>Date<input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><div className="form-row"><label>Vendor<input name="vendor" required /></label><label>Category<select name="category"><option>Supplies</option><option>Labor</option><option>Vehicle</option><option>Equipment</option><option>Marketing</option><option>Insurance</option><option>Software</option><option>Professional services</option><option>Other</option></select></label></div><label>Description<input name="description" /></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><label className="consent-row"><input name="taxDeductible" type="checkbox" defaultChecked /><span>Mark as potentially tax-deductible</span></label><button className="button" type="submit">Save expense</button></form></article><article className="admin-card table-card"><div className="card-heading"><div><span>Ledger</span><h2>Recent Expenses</h2></div></div><div className="expense-list">{expenses.length === 0 && <p className="admin-empty">No expenses logged in this period.</p>}{expenses.map((expense) => <div key={expense.id}><span><strong>{expense.vendor}</strong><small>{expense.expenseDate} · {expense.category}{expense.taxDeductible ? " · Deductible" : ""}</small><em>{expense.description}</em></span><b>{formatMoney(expense.amountCents)}</b><button type="button" onClick={() => removeExpense(expense.id)}>×</button></div>)}</div></article></div>
          </section>
        )}

        {!loading && activeTab === "analytics" && analytics && dashboard && (
          <section className="admin-section">
            <div className="metric-grid"><MetricCard label="Website page views" value={String(analytics.totals.pageViews)} note={`${range}-day host-page views`} /><MetricCard label="Booking-form clicks" value={String(analytics.totals.bookingClicks)} note="Clicks opening BookingKoala" /><MetricCard label="Contact-form clicks" value={String(analytics.totals.contactClicks)} note="Clicks opening contact" /><MetricCard label="Phone clicks" value={String(analytics.totals.phoneClicks)} note="Tap-to-call engagement" /></div>
            <p className="card-intro">These are host-website engagement metrics only. Booking completions, payment, revenue, and activity inside embedded forms are reported in BookingKoala.</p>
            <div className="dashboard-grid"><article className="admin-card table-card"><div className="card-heading"><div><span>Attribution</span><h2>Host Website Channels</h2></div></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Source</th><th>Sessions</th><th>Booking clicks</th></tr></thead><tbody>{analytics.channels.map((channel) => <tr key={channel.source}><td><strong>{channel.source}</strong></td><td>{channel.sessions}</td><td>{channel.bookingClicks}</td></tr>)}</tbody></table></div></article><article className="admin-card service-performance"><div className="card-heading"><div><span>Content</span><h2>Top Pages</h2></div></div><div>{analytics.topPages.map((page) => <div key={page.path}><strong>{page.path}</strong><b>{page.views}</b></div>)}{analytics.topPages.length === 0 && <p className="admin-empty">Page-view data will appear after launch.</p>}</div></article></div>
          </section>
        )}
      </main>
    </div>
  );
}

function BookingTable({ bookings }: { bookings: AdminBooking[] }) {
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Service</th><th>Date &amp; time</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.customerName}</strong><small><a href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a><br />{booking.confirmationCode}</small></td><td><strong>{booking.serviceName}</strong><small><a href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a>{booking.notes ? <><br />Note: {booking.notes}</> : null}</small></td><td><strong>{booking.bookingDate}</strong><small>{booking.startTime}–{booking.endTime}</small></td><td><StatusPill value={booking.paymentStatus} /></td><td>{formatMoney(booking.totalCents)}</td><td><StatusPill value={booking.status} /></td></tr>)}</tbody></table>{bookings.length === 0 && <p className="admin-empty">No historical bookings match this view.</p>}</div>;
}
