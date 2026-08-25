import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  Globe2,
  LayoutDashboard,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";
import { supabase } from "./supabase";
import "./App.css";

const kpis = {
  today: { orders: 18, revenue: 18.02 },
  mtd: { orders: 643, revenue: 561.91 },
  prevMonthSameDay: { orders: 536, revenue: 459.44 },
  prevMonth: { orders: 964, revenue: 818.9 },
};

const leaderboard = [
  { rank: 1, name: "Faizan", initials: "FZ", daily: 0, dailyRev: 0, mtd: 145, mtdRev: 133.8, arpu: 923, target: 116, prevMonth: 87 },
  { rank: 2, name: "Talha", initials: "TA", daily: 4, dailyRev: 5.0, mtd: 121, mtdRev: 103.7, arpu: 857, target: 97, prevMonth: 46 },
  { rank: 3, name: "Bhageshri", initials: "BH", daily: 3, dailyRev: 2.0, mtd: 118, mtdRev: 93.5, arpu: 792, target: 94, prevMonth: 60 },
  { rank: 4, name: "Nidhi", initials: "ND", daily: 5, dailyRev: 4.2, mtd: 95, mtdRev: 78.8, arpu: 829, target: 76, prevMonth: 53 },
  { rank: 5, name: "Sanika", initials: "SK", daily: 5, dailyRev: 5.7, mtd: 95, mtdRev: 83.3, arpu: 877, target: 76, prevMonth: 57 },
  { rank: 6, name: "Prabhat", initials: "PB", daily: 1, dailyRev: 1.1, mtd: 62, mtdRev: 60.9, arpu: 983, target: 50, prevMonth: 79 },
  { rank: 7, name: "Farooq", initials: "FQ", daily: 0, dailyRev: 0, mtd: 7, mtdRev: 7.9, arpu: 1125, target: 6, prevMonth: 0 },
];

const dailySummary = [
  { day: "01 Jun", value: 32 }, { day: "02 Jun", value: 44 }, { day: "03 Jun", value: 38 },
  { day: "04 Jun", value: 46 }, { day: "05 Jun", value: 33 }, { day: "06 Jun", value: 41 },
  { day: "07 Jun", value: 56 }, { day: "08 Jun", value: 39 }, { day: "09 Jun", value: 34 },
  { day: "10 Jun", value: 43 }, { day: "11 Jun", value: 29 }, { day: "12 Jun", value: 36 },
  { day: "13 Jun", value: 24 }, { day: "14 Jun", value: 40 }, { day: "15 Jun", value: 52 },
  { day: "16 Jun", value: 47 }, { day: "17 Jun", value: 30 }, { day: "18 Jun", value: 26 },
];

const monthlySummary = [
  { month: "Nov 25", value: 120 }, { month: "Dec 25", value: 260 }, { month: "Jan 26", value: 340 },
  { month: "Feb 26", value: 430 }, { month: "Mar 26", value: 470 }, { month: "Apr 26", value: 640 },
  { month: "May 26", value: 895 }, { month: "Jun 26", value: 700 },
];

const currency = (value) => `₹${Number(value).toFixed(2)}K`;

function useCountUp(target, duration = 750, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const tick = (time) => {
      if (start === undefined) start = time;
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-IN");
}

function KpiCard({ label, orders, revenue, compare, primary = false, icon: Icon }) {
  const orderValue = useCountUp(orders, 800);
  const revenueValue = useCountUp(revenue, 900, 2);
  const change = compare == null ? null : (((orders - compare) / compare) * 100).toFixed(1);
  const positive = change != null && Number(change) >= 0;

  return (
    <div className={`card kpi-card ${primary ? "primary" : ""} fade-in`}>
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon"><Icon size={16} /></div>
      </div>
      <div className="kpi-value-row">
        <div className="kpi-value">{orderValue}</div>
        <div className="kpi-unit">orders</div>
      </div>
      <div className="kpi-secondary price">₹{revenueValue}K <span className="kpi-unit">revenue</span></div>
      <div className={`kpi-foot ${positive ? "up" : change != null ? "down" : ""}`}>
        {change != null && <>{positive ? "▲" : "▼"} {Math.abs(change)}% vs comparison period</>}
        {change == null && "Live sales snapshot"}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, currencyValue = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#160c24", color: "#f8efff", borderRadius: 12, padding: "10px 12px", boxShadow: "0 12px 30px rgba(0,0,0,.42)" }}>
      <div style={{ fontSize: 10, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3 }}>
        <span style={{ color: currencyValue ? "#ff647c" : "#f8efff" }}>
          {currencyValue ? currency(payload[0].value) : payload[0].value}
        </span>
      </div>
    </div>
  );
}

function Leaderboard() {
  return (
    <div className="card fade-in">
      <div className="card-header">
        <div>
          <div className="card-title">Sales leaderboard</div>
          <div className="card-subtitle">Performance ranking for the current sales period</div>
        </div>
        <Trophy size={18} color="#4fd1c5" />
      </div>

      <div className="table-wrap">
        <table className="sales-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sales person</th>
              <th>Daily</th>
              <th>MTD</th>
              <th>Revenue</th>
              <th>ARPU</th>
              <th>Target</th>
              <th>Prev. month</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((person) => (
              <tr key={person.name}>
                <td><span className={`rank-badge ${person.rank === 1 ? "top" : ""}`}>{person.rank}</span></td>
                <td>
                  <div className="person">
                    <span className="avatar">{person.initials}</span>
                    <span className="person-name">{person.name}</span>
                  </div>
                </td>
                <td>{person.daily}<br /><span style={{ color: "#98a2b3", fontSize: 10 }}>{person.dailyRev ? <span className="price">₹{person.dailyRev}K</span> : "—"}</span></td>
                <td className="orange-text">{person.mtd}</td>
                <td className="money price">₹{person.mtdRev}K</td>
                <td className="price">₹{person.arpu.toLocaleString("en-IN")}</td>
                <td className="target-cell">
                  <div className="target-row">
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(person.target, 100)}%` }} /></div>
                    <span className="target-value">{person.target}%</span>
                  </div>
                </td>
                <td>{person.prevMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FALLBACK_DESTINATIONS = [
  { code: "EUR", name: "Europe", count: 47 },
  { code: "GBR", name: "United Kingdom", count: 9 },
  { code: "USA", name: "United States", count: 7 },
  { code: "KOR", name: "South Korea", count: 6 },
  { code: "MYS", name: "Malaysia", count: 5 },
  { code: "WLD", name: "Orange World", count: 5 },
  { code: "OHE", name: "Orange Holiday Europe", count: 7 },
];

function TopDestinations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("order_no, order_date_time, product_id")
          .order("order_no", { ascending: false })
          .limit(10000);

        if (ordersError) throw ordersError;

        const parsed = (orders || [])
          .map((order) => ({ ...order, date: new Date(String(order.order_date_time).replace(" ", "T")) }))
          .filter((order) => !Number.isNaN(order.date.getTime()));

        if (!parsed.length) {
          if (!cancelled) setData([]);
          return;
        }

        const latest = parsed.reduce((a, b) => a.date > b.date ? a : b).date;
        const start = new Date(latest.getFullYear(), latest.getMonth(), 1);
        const end = new Date(latest.getFullYear(), latest.getMonth() + 1, 1);
        const mtd = parsed.filter((order) => order.date >= start && order.date < end);
        const ids = [...new Set(mtd.map((order) => order.product_id).filter(Boolean).map(Number))];
        if (!ids.length) {
          if (!cancelled) setData([]);
          return;
        }

        const [{ data: products, error: productError }, { data: destinations, error: destinationError }] = await Promise.all([
          supabase.from("products").select("prod_id, coverageDestinations, allocatedDestinations").in("prod_id", ids),
          supabase.from("Destination").select("destination_id, destination_name").limit(10000),
        ]);

        if (productError) throw productError;
        if (destinationError) throw destinationError;

        const productMap = new Map((products || []).map((product) => [String(product.prod_id), product]));
        const destinationMap = new Map((destinations || []).map((item) => [String(item.destination_id).trim().toUpperCase(), item.destination_name || item.destination_id]));
        const counts = new Map();

        for (const order of mtd) {
          const product = productMap.get(String(order.product_id));
          if (!product) continue;
          const codes = String(product.coverageDestinations || product.allocatedDestinations || "")
            .split(",").map((code) => code.trim().toUpperCase()).filter(Boolean);

          [...new Set(codes)].forEach((code) => {
            const name = destinationMap.get(code);
            if (!name) return;
            counts.set(code, { code, name, count: (counts.get(code)?.count || 0) + 1 });
          });
        }

        const result = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("Top destinations: Supabase fetch failed", err);
        if (!cancelled) {
          setData(FALLBACK_DESTINATIONS);
          setUsingFallback(true);
          setError("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div>
          <div className="card-title">Top destinations</div>
          <div className="card-subtitle">Most frequently sold destinations • MTD{usingFallback ? " • snapshot" : ""}</div>
        </div>
        <Globe2 size={18} color="#4fd1c5" />
      </div>

      {loading && <div className="empty-state">Loading destination intelligence…</div>}
      {!loading && error && <div className="error-state">{error}</div>}
      {!loading && !error && data.length === 0 && <div className="empty-state">No destination data available.</div>}

      {!loading && !error && data.length > 0 && (
        <div className="destinations">
          {data.map((item) => (
            <div className="destination-row" key={item.code}>
              <div className="destination-head">
                <div className="destination-name">{item.name}</div>
                <div className="destination-count">{item.count}</div>
              </div>
              <div className="destination-track"><div className="destination-fill" style={{ width: `${(item.count / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SalesChart({ monthly = false }) {
  const data = monthly ? monthlySummary : dailySummary;
  return (
    <div className="card chart-card fade-in">
      <div className="card-header">
        <div>
          <div className="card-title">{monthly ? "Monthly sales trend" : "Daily sales trend"}</div>
          <div className="card-subtitle">{monthly ? "Revenue movement over the last eight months" : "Order volume across the current month"}</div>
        </div>
        <Target size={18} color="#4fd1c5" />
      </div>

      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 14, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={monthly ? "monthlyGradient" : "dailyGradient"} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#63e6be" stopOpacity={0.34} />
                <stop offset="55%" stopColor="#b54bdf" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#63e6be" stopOpacity={0} />
              </linearGradient>
              <filter id={monthly ? "monthlyShadow" : "dailyShadow"} x="-20%" y="-30%" width="140%" height="170%">
                <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#34d399" floodOpacity="0.34" />
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="#2a1b39" />
            <XAxis
              dataKey={monthly ? "month" : "day"}
              tick={{ fontSize: 10, fill: "#8d7e9f" }}
              axisLine={false}
              tickLine={false}
              interval={monthly ? 0 : 2}
            />
            <YAxis tick={{ fontSize: 10, fill: "#8d7e9f" }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<ChartTooltip currencyValue={monthly} />} cursor={{ stroke: "#63e6be", strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#63e6be"
              strokeWidth={3}
              filter={`url(#${monthly ? "monthlyShadow" : "dailyShadow"})`}
              fill={`url(#${monthly ? "monthlyGradient" : "dailyGradient"})`}
              dot={false}
              activeDot={{ r: 5, fill: "#63e6be", stroke: "#f8efff", strokeWidth: 2 }}
              animationDuration={1100}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function exportLeaderboard() {
  const headers = ["Rank", "Sales Person", "Daily Orders", "Daily Revenue (K)", "MTD Orders", "MTD Revenue (K)", "ARPU", "Target %", "Previous Month Orders"];
  const rows = leaderboard.map((item) => [item.rank, item.name, item.daily, item.dailyRev, item.mtd, item.mtdRev, item.arpu, item.target, item.prevMonth]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "sales-leaderboard.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [period, setPeriod] = useState("MTD");
  const [query, setQuery] = useState("");

  const filteredLeaderboard = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leaderboard;
    return leaderboard.filter((item) => item.name.toLowerCase().includes(needle));
  }, [query]);

  return (
    <div className="dashboard-app">
      <div className="dashboard-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <div className="brand-mark"><Sparkles size={18} /></div>
              <div>
                <div className="brand-name">Janvi Sales Pulse</div>
                <div className="brand-subtitle">Sales workspace</div>
              </div>
            </div>

            <div className="search-box">
              <Search size={14} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search salesperson…" />
            </div>

            <div className="toolbar">
              <button className="control"><CalendarDays size={14} /> 18 Jun 2026 <ChevronDown size={13} /></button>
              {['Today', 'MTD', 'Prev. month'].map((item) => (
                <button key={item} className={`control ${period === item ? "active" : ""}`} onClick={() => setPeriod(item)}>{item}</button>
              ))}
              <button className="control" onClick={exportLeaderboard}><Download size={14} /> Export</button>
              <button className="icon-button" title="Filters"><Filter size={15} /></button>
              <button className="icon-button" title="Notifications"><Bell size={15} /></button>
            </div>
          </div>
        </header>

        <section className="page-intro">
          <div>
            <div className="eyebrow">Sales overview</div>
            <h1 className="page-title">Performance at a glance</h1>
            <p className="page-description">Track orders, revenue, team performance, targets, and demand in one focused workspace.</p>
          </div>
          <div className="refresh-chip"><RefreshCw size={11} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Refreshed from dashboard snapshot</div>
        </section>

        <section className="kpi-grid">
          <KpiCard primary label="Today's performance" orders={kpis.today.orders} revenue={kpis.today.revenue} icon={LayoutDashboard} />
          <KpiCard label="June MTD" orders={kpis.mtd.orders} revenue={kpis.mtd.revenue} icon={Wallet} />
          <KpiCard label="Same day last month" orders={kpis.prevMonthSameDay.orders} revenue={kpis.prevMonthSameDay.revenue} compare={kpis.today.orders} icon={CalendarDays} />
          <KpiCard label="Previous month" orders={kpis.prevMonth.orders} revenue={kpis.prevMonth.revenue} compare={kpis.mtd.orders} icon={Target} />
        </section>

        <section className="section-grid">
          <Leaderboard />
          <TopDestinations />
        </section>

        <section className="section-grid equal">
          <SalesChart />
          <SalesChart monthly />
        </section>

        <div className="footer-note">
          Janvi Sales Pulse Console · Period selected: <strong>{period}</strong> · Dashboard data remains based on the supplied source snapshot unless connected to live metrics.
        </div>
      </div>
    </div>
  );
}
