import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, "api", "data.json"), "utf8")
);

function buildResponse(selectedDate) {
  const daily = fixture.daily_summary.find((d) => d.date === selectedDate)
    || fixture.daily_summary[fixture.daily_summary.length - 1];

  const yearMonth = selectedDate.slice(0, 7);
  const monthRows = fixture.daily_summary.filter((d) => d.date.startsWith(yearMonth));
  const monthMtd = monthRows.length
    ? {
        orders: monthRows.reduce((s, d) => s + d.orders, 0),
        revenue: Number(monthRows.reduce((s, d) => s + d.revenue, 0).toFixed(2))
      }
    : fixture.month_mtd;

  const previousDay = new Date(`${selectedDate}T00:00:00`);
  previousDay.setMonth(previousDay.getMonth() - 1);
  const prevDate = previousDay.toISOString().slice(0, 10);

  return {
    selected_date: selectedDate,
    today_performance: daily,
    month_mtd: monthMtd,
    prev_month: fixture.prev_month,
    prev_month_same_day: {
      ...fixture.prev_month_same_day,
      date: prevDate
    },
    daily_summary: fixture.daily_summary,
    monthly_summary: fixture.monthly_summary,
    top_destinations: fixture.top_destinations,
    daily_leaderboard: fixture.daily_leaderboard
  };
}

app.get("/api/sales-dashboard", (req, res) => {
  const date = String(req.query.date || "2026-05-25");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  res.json(buildResponse(date));
});

app.get("/api", (_req, res) => {
  res.json({
    name: "Sales Dashboard API",
    endpoint: "/api/sales-dashboard?date=YYYY-MM-DD",
    example: "/api/sales-dashboard?date=2026-05-25",
    method: "GET"
  });
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Sales Dashboard running on port ${PORT}`);
});
