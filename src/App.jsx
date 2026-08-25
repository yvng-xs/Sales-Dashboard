import React, { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Download, Filter, Globe2, LayoutDashboard, Search, Sparkles, Target, Trophy, Wallet } from "lucide-react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const initialDate = "2026-05-25";

const moneyK = (v) => `₹${(Number(v || 0) / 1000).toFixed(2)}K`;
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function KpiCard({ label, data, compare, icon: Icon, primary }) {
  const pct = compare?.orders ? ((data.orders - compare.orders) / compare.orders) * 100 : null;
  return (
    <div className={`card kpi-card ${primary ? "primary" : ""}`}>
      <div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon"><Icon size={16} /></span></div>
      <div className="kpi-value-row"><span className="kpi-value">{Number(data.orders || 0).toLocaleString("en-IN")}</span><span className="kpi-unit">orders</span></div>
      <div className="kpi-secondary price">{moneyK(data.revenue)} <span className="kpi-unit">revenue</span></div>
      <div className={`kpi-foot ${pct >= 0 ? "up" : "down"}`}>
        {pct == null ? "Selected-date performance" : `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}% vs comparison`}
      </div>
    </div>
  );
}

function Chart({ title, subtitle, data, monthly }) {
  const rows = monthly
    ? data.map(x => ({ label: x.month, value: x.revenue / 1000 }))
    : data.map(x => ({ label: x.date.slice(5), value: x.orders }));
  return (
    <div className="card chart-card">
      <div className="card-header"><div><div className="card-title">{title}</div><div className="card-subtitle">{subtitle}</div></div><Target size={18} color="#4fd1c5" /></div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 14, left: -16, bottom: 0 }}>
            <defs><linearGradient id={monthly ? "mg" : "dg"} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#63e6be" stopOpacity={0.34}/><stop offset="100%" stopColor="#63e6be" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#2a1b39" />
            <XAxis dataKey="label" tick={{fontSize:10,fill:"#8d7e9f"}} axisLine={false} tickLine={false} interval={monthly ? 0 : 1}/>
            <YAxis tick={{fontSize:10,fill:"#8d7e9f"}} axisLine={false} tickLine={false} width={38}/>
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#63e6be" strokeWidth={3} fill={`url(#${monthly ? "mg" : "dg"})`} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("MTD");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch(`${API_BASE}/api/sales-dashboard?date=${selectedDate}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error("API request failed"); return r.json(); })
      .then(setData)
      .catch(e => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [selectedDate]);

  const leaderboard = useMemo(() => {
    const rows = data?.daily_leaderboard || [];
    const q = query.trim().toLowerCase();
    return rows
      .filter(x => !q || x.sales_rep.toLowerCase().includes(q))
      .map((x, i) => ({ ...x, rank: i + 1 }));
  }, [data, query]);

  const exportCSV = () => {
    const headers = ["Rank","Sales Person","Daily Orders","Daily Revenue","MTD Orders","MTD Revenue","ARPU","Target %"];
    const rows = leaderboard.map(x => [x.rank,x.sales_rep,x.day_orders,x.day_revenue,x.mtd_orders,x.mtd_revenue,x.arpu,x.target_percent]);
    const csv = [headers,...rows].map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
    a.download = `sales-leaderboard-${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="dashboard-app">
      <div className="dashboard-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand"><div className="brand-mark"><Sparkles size={18}/></div><div><div className="brand-name">Sales Pulse</div><div className="brand-subtitle">Sales workspace</div></div></div>
            <div className="search-box"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search salesperson…"/></div>
            <div className="toolbar">
              <label className="control date-control"><CalendarDays size={14}/><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label>
              {["Today","MTD","Prev. month"].map(x=><button key={x} className={`control ${period===x?"active":""}`} onClick={()=>setPeriod(x)}>{x}</button>)}
              <button className="control" onClick={exportCSV}><Download size={14}/> Export</button>
              <button className="icon-button"><Filter size={15}/></button>
            </div>
          </div>
        </header>

        {error && <div className="error-state">API error: {error}</div>}
        {!data && !error && <div className="empty-state">Loading sales data…</div>}

        {data && <main>
          <section className="page-intro"><div><div className="eyebrow">Sales overview</div><h1 className="page-title">Performance at a glance</h1><p className="page-description">Dynamic sales intelligence for the selected date.</p></div><div className="refresh-chip">Selected: {data.selected_date}</div></section>

          <section className="kpi-grid">
            <KpiCard primary label="Selected day" data={data.today_performance} compare={data.prev_month_same_day} icon={LayoutDashboard}/>
            <KpiCard label="Month to date" data={data.month_mtd} icon={Wallet}/>
            <KpiCard label="Same day last month" data={data.prev_month_same_day} icon={CalendarDays}/>
            <KpiCard label="Previous month" data={data.prev_month} compare={data.month_mtd} icon={Target}/>
          </section>

          <section className="section-grid">
            <div className="card"><div className="card-header"><div><div className="card-title">Sales leaderboard</div><div className="card-subtitle">Selected-date and MTD performance</div></div><Trophy size={18} color="#4fd1c5"/></div>
              <div className="table-wrap"><table className="sales-table"><thead><tr><th>#</th><th>Sales person</th><th>Daily</th><th>MTD</th><th>Revenue</th><th>ARPU</th><th>Target</th></tr></thead>
              <tbody>{leaderboard.map(x=><tr key={x.sales_rep}><td><span className={`rank-badge ${x.rank===1?"top":""}`}>{x.rank}</span></td><td><div className="person"><span className="avatar">{x.sales_rep.slice(0,2).toUpperCase()}</span><span className="person-name">{x.sales_rep}</span></div></td><td>{x.day_orders}<br/><span className="price">{money(x.day_revenue)}</span></td><td className="orange-text">{x.mtd_orders}</td><td className="money price">{money(x.mtd_revenue)}</td><td className="price">{money(x.arpu)}</td><td><div className="target-row"><div className="progress-track"><div className="progress-fill" style={{width:`${Math.min(x.target_percent,100)}%`}}/></div><span className="target-value">{x.target_percent.toFixed(1)}%</span></div></td></tr>)}</tbody></table></div>
            </div>
            <div className="card"><div className="card-header"><div><div className="card-title">Top destinations</div><div className="card-subtitle">Highest order volume</div></div><Globe2 size={18} color="#4fd1c5"/></div>
              <div className="destinations">{data.top_destinations.map((x,i)=><div className="destination-row" key={x.destination}><div className="destination-head"><div className="destination-name">{x.destination}</div><div className="destination-count">{x.orders}</div></div><div className="destination-track"><div className="destination-fill" style={{width:`${Math.max(8, x.orders / data.top_destinations[0].orders * 100)}%`}}/></div></div>)}</div>
            </div>
          </section>

          <section className="section-grid equal">
            <Chart title="Daily sales trend" subtitle="Orders by selected-month date" data={data.daily_summary} />
            <Chart title="Monthly sales trend" subtitle="Revenue over recent months" data={data.monthly_summary} monthly />
          </section>

          <div className="footer-note">Janvi Sales Pulse Console · API: /api/sales-dashboard · Selected date: <strong>{selectedDate}</strong></div>
        </main>}
      </div>
    </div>
  );
}
