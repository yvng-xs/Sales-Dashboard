import fixture from "./data.json" with { type: "json" };

export default function handler(req, res) {
  const date = String(req.query.date || "2026-05-25");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: "date must be YYYY-MM-DD"
    });
  }

  try {
    const daily =
      fixture.daily_summary.find((d) => d.date === date) ||
      fixture.daily_summary[fixture.daily_summary.length - 1];

    const yearMonth = date.slice(0, 7);

    const monthRows = fixture.daily_summary.filter((d) =>
      d.date.startsWith(yearMonth)
    );

    const monthMtd = monthRows.length
      ? {
          orders: monthRows.reduce((sum, d) => sum + d.orders, 0),
          revenue: Number(
            monthRows.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)
          )
        }
      : fixture.month_mtd;

    const previousDay = new Date(`${date}T00:00:00`);
    previousDay.setMonth(previousDay.getMonth() - 1);

    return res.status(200).json({
      selected_date: date,
      today_performance: daily,
      month_mtd: monthMtd,
      prev_month: fixture.prev_month,
      prev_month_same_day: {
        ...fixture.prev_month_same_day,
        date: previousDay.toISOString().slice(0, 10)
      },
      daily_summary: fixture.daily_summary,
      monthly_summary: fixture.monthly_summary,
      top_destinations: fixture.top_destinations,
      daily_leaderboard: fixture.daily_leaderboard
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to load dashboard data"
    });
  }
}