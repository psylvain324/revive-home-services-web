import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api, formatMoney } from "./api";
import type { AdminBooking, AdminSettings, Customer, DashboardData, Expense, Inquiry } from "./types";

type AdminSession = { authenticated: boolean; email?: string };
type AnalyticsData = {
  totals: { pageViews: number; bookingStarts: number; inquiries: number; completedBookings: number };
  channels: Array<{ source: string; sessions: number; bookings: number; revenueCents: number }>;
  topPages: Array<{ path: string; views: number }>;
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const navItems = [
  ["overview", "Overview"],
  ["bookings", "Bookings"],
  ["inquiries", "Inquiries"],
  ["availability", "Availability & Pricing"],
  ["customers", "Customers"],
  ["expenses", "Expenses & Taxes"],
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
        <a href="/" className="admin-brand"><img src="/images/revive-co-logo-transparent.png" alt="Revive Co" width="360" height="240" /></a>
        <div><p className="eyebrow">Operations Portal</p><h1>Your Schedule.<br />Your Numbers.<br /><em>One Clean View.</em></h1><p>Secure tools for bookings, customers, revenue, availability, expenses, and tax planning.</p></div>
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
  const [settings, setSettings] = useState<AdminSettings | null>(null);
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
      const [dashboardData, bookingData, inquiryData, settingsData, customerData, expenseData, analyticsData] = await Promise.all([
        api.get<DashboardData>(`/api/admin-dashboard?range=${days}`),
        api.get<{ bookings: AdminBooking[] }>("/api/admin-bookings"),
        api.get<{ inquiries: Inquiry[] }>("/api/admin-inquiries"),
        api.get<AdminSettings>("/api/admin-settings"),
        api.get<{ customers: Customer[] }>("/api/admin-customers"),
        api.get<{ expenses: Expense[] }>(`/api/admin-expenses?range=${days}`),
        api.get<AnalyticsData>(`/api/admin-analytics?range=${days}`),
      ]);
      setDashboard(dashboardData);
      setBookings(bookingData.bookings);
      setInquiries(inquiryData.inquiries);
      setSettings(settingsData);
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

  const updateBooking = async (id: string, status: string) => {
    setError("");
    try {
      await api.patch("/api/admin-bookings", { id, status });
      setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status } : booking));
      setNotice("Booking status updated.");
      void loadData(range);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update booking."); }
  };

  const updateInquiry = async (id: string, status: string) => {
    try {
      await api.patch("/api/admin-inquiries", { id, status });
      setInquiries((current) => current.map((inquiry) => inquiry.id === id ? { ...inquiry, status } : inquiry));
      setNotice("Inquiry status updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update inquiry."); }
  };

  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    const matchesStatus = bookingFilter === "all" || booking.status === bookingFilter;
    const query = bookingSearch.toLowerCase();
    const matchesSearch = !query || `${booking.customerName} ${booking.customerEmail} ${booking.customerPhone} ${booking.confirmationCode} ${booking.serviceName}`.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  }), [bookings, bookingFilter, bookingSearch]);

  const saveSettings = async () => {
    if (!settings) return;
    setError(""); setNotice("");
    try {
      const updated = await api.put<AdminSettings>("/api/admin-settings", settings);
      setSettings(updated);
      setNotice("Availability, pricing, and payment settings saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save settings."); }
  };

  const addBlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const updated = await api.post<AdminSettings>("/api/admin-settings", { action: "add-block", ...data });
      setSettings(updated);
      event.currentTarget.reset();
      setNotice("Time blocked from customer booking.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to block that time."); }
  };

  const removeBlock = async (id: string) => {
    try {
      const updated = await api.delete<AdminSettings>("/api/admin-settings", { action: "remove-block", id });
      setSettings(updated);
      setNotice("Blocked time removed.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to remove blocked time."); }
  };

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
        <a className="admin-logo" href="/"><img src="/images/revive-co-logo-transparent.png" alt="Revive Co" width="360" height="240" /></a>
        <nav aria-label="Admin navigation">
          {navItems.map(([id, label]) => <button type="button" key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}><span aria-hidden="true">{id === "overview" ? "⌂" : id === "bookings" ? "▣" : id === "inquiries" ? "✉" : id === "availability" ? "◷" : id === "customers" ? "◎" : id === "expenses" ? "$" : "↗"}</span>{label}</button>)}
        </nav>
        <div className="admin-sidebar-footer"><span>Signed In</span><strong>{session.email}</strong><button type="button" onClick={logout}>Sign Out</button><small>Sales Vision Platform</small></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><p className="panel-kicker">Revive Co Operations</p><h1>{navItems.find(([id]) => id === activeTab)?.[1]}</h1></div>
          <div className="admin-top-actions"><select value={range} onChange={(e) => refreshRange(Number(e.target.value))} aria-label="Reporting period"><option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option><option value={365}>Last Year</option></select><a className="button button-small" href="/book" target="_blank">New Booking ↗</a></div>
        </header>
        {error && <div className="admin-alert error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {notice && <div className="admin-alert success" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
        {loading && <div className="admin-loading inline">Refreshing dashboard…</div>}

        {!loading && activeTab === "overview" && dashboard && (
          <section className="admin-section">
            <div className="metric-grid">
              <MetricCard label="Collected revenue" value={formatMoney(dashboard.summary.grossRevenueCents)} note={`${dashboard.rangeDays}-day gross payments`} />
              <MetricCard label="Upcoming bookings" value={String(dashboard.summary.bookings)} note="Active appointments in range" />
              <MetricCard label="Net after expenses" value={formatMoney(dashboard.summary.netCents)} note={`${formatMoney(dashboard.summary.expenseCents)} expenses logged`} />
              <MetricCard label="Estimated tax reserve" value={formatMoney(dashboard.summary.estimatedTaxCents)} note="Planning estimate, not tax advice" />
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
                <div>{dashboard.bookingsByService.length === 0 && <p className="admin-empty">No completed bookings in this period.</p>}{dashboard.bookingsByService.map((service) => <div key={service.name}><span><strong>{service.name}</strong><small>{service.count} booking{service.count === 1 ? "" : "s"}</small></span><b>{formatMoney(service.revenueCents)}</b></div>)}</div>
              </article>
            </div>
            <article className="admin-card table-card">
              <div className="card-heading"><div><span>Schedule</span><h2>Recent Bookings</h2></div><button type="button" onClick={() => setActiveTab("bookings")}>View All →</button></div>
              <BookingTable bookings={dashboard.recentBookings} onStatus={updateBooking} />
            </article>
          </section>
        )}

        {!loading && activeTab === "bookings" && (
          <section className="admin-section">
            <div className="admin-toolbar"><input value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} placeholder="Search customer, service or confirmation" aria-label="Search bookings" /><select value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)} aria-label="Filter booking status"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <article className="admin-card table-card"><div className="card-heading"><div><span>Appointments</span><h2>{filteredBookings.length} Bookings</h2></div></div><BookingTable bookings={filteredBookings} onStatus={updateBooking} /></article>
          </section>
        )}

        {!loading && activeTab === "inquiries" && (
          <section className="admin-section">
            <article className="admin-card table-card">
              <div className="card-heading"><div><span>Lead Inbox</span><h2>{inquiries.length} Inquiries</h2></div></div>
              <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Service</th><th>Message</th><th>Received</th><th>Status</th></tr></thead><tbody>{inquiries.map((inquiry) => <tr key={inquiry.id}><td><strong>{inquiry.customerName}</strong><small><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a><br /><a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a></small></td><td>{inquiry.service.replaceAll("-", " ")}</td><td className="message-cell">{inquiry.message}</td><td>{new Date(inquiry.createdAt).toLocaleDateString()}</td><td><select aria-label={`Status for ${inquiry.customerName}'s inquiry`} value={inquiry.status} onChange={(event) => updateInquiry(inquiry.id, event.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="won">Won</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table>{inquiries.length === 0 && <p className="admin-empty">New website inquiries will appear here.</p>}</div>
            </article>
          </section>
        )}

        {!loading && activeTab === "availability" && settings && (
          <section className="admin-section settings-grid">
            <article className="admin-card settings-card">
              <div className="card-heading"><div><span>Weekly Schedule</span><h2>Business Hours</h2></div></div>
              <p className="card-intro">Customers can only choose times that fit inside these hours after service duration and buffer time are applied.</p>
              <div className="hours-list">
                {settings.hours.sort((a, b) => a.weekday - b.weekday).map((hour) => <div key={hour.weekday}><label className="toggle"><input aria-label={`Enable ${dayNames[hour.weekday]} hours`} type="checkbox" checked={hour.enabled} onChange={(e) => setSettings({ ...settings, hours: settings.hours.map((item) => item.weekday === hour.weekday ? { ...item, enabled: e.target.checked } : item) })} /><span /></label><strong>{dayNames[hour.weekday]}</strong>{hour.enabled ? <><input aria-label={`${dayNames[hour.weekday]} opening time`} type="time" value={hour.openTime} onChange={(e) => setSettings({ ...settings, hours: settings.hours.map((item) => item.weekday === hour.weekday ? { ...item, openTime: e.target.value } : item) })} /><span>to</span><input aria-label={`${dayNames[hour.weekday]} closing time`} type="time" value={hour.closeTime} onChange={(e) => setSettings({ ...settings, hours: settings.hours.map((item) => item.weekday === hour.weekday ? { ...item, closeTime: e.target.value } : item) })} /></> : <em>Closed</em>}</div>)}
              </div>
              <div className="form-row form-row-3"><label>Time zone<select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}><option>America/New_York</option><option>America/Chicago</option><option>America/Denver</option><option>America/Phoenix</option><option>America/Los_Angeles</option></select></label><label>Lead time (hours)<input type="number" min="0" max="336" value={settings.leadTimeHours} onChange={(e) => setSettings({ ...settings, leadTimeHours: Number(e.target.value) })} /></label><label>Buffer (minutes)<input type="number" min="0" max="240" step="15" value={settings.bufferMinutes} onChange={(e) => setSettings({ ...settings, bufferMinutes: Number(e.target.value) })} /></label></div>
            </article>
            <article className="admin-card settings-card">
              <div className="card-heading"><div><span>Overrides</span><h2>Block Time Off</h2></div></div>
              <form className="block-form" onSubmit={addBlock}><label>Date<input name="date" type="date" required /></label><div className="form-row"><label>From<input name="startTime" type="time" defaultValue="08:00" required /></label><label>To<input name="endTime" type="time" defaultValue="17:00" required /></label></div><label>Reason<input name="reason" placeholder="Vacation, fully booked, holiday…" required /></label><button className="button button-small" type="submit">Block time</button></form>
              <div className="block-list">{settings.blockedTimes.length === 0 && <p className="admin-empty">No blocked times.</p>}{settings.blockedTimes.map((block) => <div key={block.id}><span><strong>{block.startsAt.slice(0, 10)}</strong><small>{block.startsAt.slice(11, 16)}–{block.endsAt.slice(11, 16)} · {block.reason}</small></span><button type="button" onClick={() => removeBlock(block.id)}>Remove</button></div>)}</div>
            </article>
            <article className="admin-card settings-card settings-wide">
              <div className="card-heading"><div><span>Services</span><h2>Pricing &amp; Duration</h2></div></div>
              <p className="card-intro">Leave a base price blank for quote-only service. Online payment is available only when a service has a price.</p>
              <div className="pricing-admin-list">
                {settings.services.map((service) => <div key={service.id}><label className="toggle"><input aria-label={`Enable ${service.name}`} type="checkbox" checked={service.active} onChange={(e) => setSettings({ ...settings, services: settings.services.map((item) => item.id === service.id ? { ...item, active: e.target.checked } : item) })} /><span /></label><span className="pricing-name"><strong>{service.name}</strong><small>{service.shortDescription}</small></span><label>Base price<input type="number" min="0" step="1" value={service.basePriceCents == null ? "" : service.basePriceCents / 100} onChange={(e) => setSettings({ ...settings, services: settings.services.map((item) => item.id === service.id ? { ...item, basePriceCents: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) } : item) })} placeholder="Quote" /></label><label>Minutes<input type="number" min="30" step="15" value={service.durationMinutes} onChange={(e) => setSettings({ ...settings, services: settings.services.map((item) => item.id === service.id ? { ...item, durationMinutes: Number(e.target.value) } : item) })} /></label></div>)}
              </div>
              <h3 className="settings-subheading">Add-Ons</h3>
              <div className="addon-admin-grid">{settings.addOns.map((addOn) => <div key={addOn.id}><label className="toggle"><input aria-label={`Enable ${addOn.name}`} type="checkbox" checked={addOn.active} onChange={(e) => setSettings({ ...settings, addOns: settings.addOns.map((item) => item.id === addOn.id ? { ...item, active: e.target.checked } : item) })} /><span /></label><strong>{addOn.name}</strong><label>Price<input type="number" min="0" value={addOn.priceCents / 100} onChange={(e) => setSettings({ ...settings, addOns: settings.addOns.map((item) => item.id === addOn.id ? { ...item, priceCents: Math.round(Number(e.target.value) * 100) } : item) })} /></label><label>Minutes<input type="number" min="0" step="15" value={addOn.durationMinutes} onChange={(e) => setSettings({ ...settings, addOns: settings.addOns.map((item) => item.id === addOn.id ? { ...item, durationMinutes: Number(e.target.value) } : item) })} /></label></div>)}</div>
            </article>
            <article className="admin-card settings-card settings-wide payment-settings">
              <div className="card-heading"><div><span>Payments &amp; Planning</span><h2>Checkout and Tax Controls</h2></div></div>
              <div className="settings-toggle-row"><label className="toggle"><input aria-label="Accept online payments" type="checkbox" checked={settings.paymentEnabled} onChange={(e) => setSettings({ ...settings, paymentEnabled: e.target.checked })} /><span /></label><div><strong>Accept online payment</strong><p>Requires Stripe keys in Netlify. Eligible customers will see cards, Apple Pay, and Google Pay in Stripe Checkout.</p></div></div>
              <div className="settings-toggle-row"><label className="toggle"><input aria-label="Use Stripe Tax at checkout" type="checkbox" checked={settings.taxEnabled} onChange={(e) => setSettings({ ...settings, taxEnabled: e.target.checked })} /><span /></label><div><strong>Use Stripe Tax at checkout</strong><p>Enable only after tax registrations and the business address are configured in Stripe.</p></div></div>
              <div className="form-row"><label>Deposit collected at booking (%)<input type="number" min="0" max="100" value={settings.depositPercent} onChange={(e) => setSettings({ ...settings, depositPercent: Number(e.target.value) })} /></label><label>Estimated income tax reserve (%)<input type="number" min="0" max="100" step="0.1" value={settings.estimatedTaxRate} onChange={(e) => setSettings({ ...settings, estimatedTaxRate: Number(e.target.value) })} /></label></div>
              <p className="legal-note">The tax reserve is an internal planning estimate. It does not calculate sales-tax liability or replace advice from a tax professional.</p>
              <button className="button" type="button" onClick={saveSettings}>Save all settings</button>
            </article>
          </section>
        )}

        {!loading && activeTab === "customers" && (
          <section className="admin-section"><article className="admin-card table-card"><div className="card-heading"><div><span>CRM</span><h2>{customers.length} Customers</h2></div></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Phone</th><th>Bookings</th><th>Lifetime value</th><th>Last service</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong><small>{customer.email}</small></td><td>{customer.phone}</td><td>{customer.totalBookings}</td><td>{formatMoney(customer.lifetimeValueCents)}</td><td>{customer.lastBookingDate || "—"}</td></tr>)}</tbody></table>{customers.length === 0 && <p className="admin-empty">Customers appear here after their first inquiry or booking.</p>}</div></article></section>
        )}

        {!loading && activeTab === "expenses" && dashboard && (
          <section className="admin-section">
            <div className="metric-grid metric-grid-3"><MetricCard label="Expenses logged" value={formatMoney(dashboard.summary.expenseCents)} note={`${dashboard.rangeDays}-day total`} /><MetricCard label="Net before reserve" value={formatMoney(dashboard.summary.netCents)} note="Collected revenue minus expenses" /><MetricCard label="Estimated tax reserve" value={formatMoney(dashboard.summary.estimatedTaxCents)} note="Based on your configured rate" /></div>
            <div className="expense-grid"><article className="admin-card settings-card"><div className="card-heading"><div><span>Manual Entry</span><h2>Add Expense</h2></div></div><form className="expense-form" onSubmit={addExpense}><label>Date<input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><div className="form-row"><label>Vendor<input name="vendor" required /></label><label>Category<select name="category"><option>Supplies</option><option>Labor</option><option>Vehicle</option><option>Equipment</option><option>Marketing</option><option>Insurance</option><option>Software</option><option>Professional services</option><option>Other</option></select></label></div><label>Description<input name="description" /></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><label className="consent-row"><input name="taxDeductible" type="checkbox" defaultChecked /><span>Mark as potentially tax-deductible</span></label><button className="button" type="submit">Save expense</button></form></article><article className="admin-card table-card"><div className="card-heading"><div><span>Ledger</span><h2>Recent Expenses</h2></div></div><div className="expense-list">{expenses.length === 0 && <p className="admin-empty">No expenses logged in this period.</p>}{expenses.map((expense) => <div key={expense.id}><span><strong>{expense.vendor}</strong><small>{expense.expenseDate} · {expense.category}{expense.taxDeductible ? " · Deductible" : ""}</small><em>{expense.description}</em></span><b>{formatMoney(expense.amountCents)}</b><button type="button" onClick={() => removeExpense(expense.id)}>×</button></div>)}</div></article></div>
          </section>
        )}

        {!loading && activeTab === "analytics" && analytics && dashboard && (
          <section className="admin-section">
            <div className="metric-grid"><MetricCard label="Page views" value={String(analytics.totals.pageViews)} note={`${range}-day tracked views`} /><MetricCard label="Booking starts" value={String(analytics.totals.bookingStarts)} note="Customers entering the flow" /><MetricCard label="Inquiries" value={String(analytics.totals.inquiries)} note="Contact leads submitted" /><MetricCard label="Conversion rate" value={`${dashboard.summary.conversionRate.toFixed(1)}%`} note="Bookings divided by tracked sessions" /></div>
            <div className="dashboard-grid"><article className="admin-card table-card"><div className="card-heading"><div><span>Attribution</span><h2>Channels</h2></div></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Source</th><th>Sessions</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>{analytics.channels.map((channel) => <tr key={channel.source}><td><strong>{channel.source}</strong></td><td>{channel.sessions}</td><td>{channel.bookings}</td><td>{formatMoney(channel.revenueCents)}</td></tr>)}</tbody></table></div></article><article className="admin-card service-performance"><div className="card-heading"><div><span>Content</span><h2>Top Pages</h2></div></div><div>{analytics.topPages.map((page) => <div key={page.path}><strong>{page.path}</strong><b>{page.views}</b></div>)}{analytics.topPages.length === 0 && <p className="admin-empty">Page-view data will appear after launch.</p>}</div></article></div>
          </section>
        )}
      </main>
    </div>
  );
}

function BookingTable({ bookings, onStatus }: { bookings: AdminBooking[]; onStatus: (id: string, status: string) => void }) {
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Service</th><th>Date &amp; time</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.customerName}</strong><small><a href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a><br />{booking.confirmationCode}</small></td><td><strong>{booking.serviceName}</strong><small><a href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a>{booking.notes ? <><br />Note: {booking.notes}</> : null}</small></td><td><strong>{booking.bookingDate}</strong><small>{booking.startTime}–{booking.endTime}</small></td><td><StatusPill value={booking.paymentStatus} /></td><td>{formatMoney(booking.totalCents)}</td><td><select value={booking.status} onChange={(e) => onStatus(booking.id, e.target.value)} aria-label={`Status for ${booking.customerName}`}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No show</option></select></td></tr>)}</tbody></table>{bookings.length === 0 && <p className="admin-empty">No bookings match this view.</p>}</div>;
}
