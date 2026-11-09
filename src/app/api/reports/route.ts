import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Yearly aggregates: monthly totals (per tracker), per-tracker totals, per-person totals. */
export async function GET(req: NextRequest) {
  const yearParam = Number(req.nextUrl.searchParams.get("year"));
  const now = new Date();
  const year = Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : now.getFullYear();

  const monthPrefix = `${year}-`;
  const payments = await db.payment.findMany({
    where: { month: { startsWith: monthPrefix } },
    orderBy: { paidAt: "asc" },
  });

  const trackers = await db.tracker.findMany({
    include: { people: { select: { id: true, name: true } } },
  });
  const trackerById = new Map(trackers.map((t) => [t.id, t]));
  const personById = new Map(trackers.flatMap((t) => t.people.map((p) => [p.id, { p, t }])));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthly: { month: string; label: string; total: number; byTracker: Record<string, number> }[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = `${year}-${String(m).padStart(2, "0")}`;
    const rows = payments.filter((p) => p.month === month);
    const byTracker: Record<string, number> = {};
    for (const r of rows) byTracker[r.trackerId] = (byTracker[r.trackerId] ?? 0) + r.amount;
    monthly.push({
      month,
      label: monthNames[m - 1],
      total: rows.reduce((s, r) => s + r.amount, 0),
      byTracker,
    });
  }

  const perTracker = trackers
    .map((t) => {
      const total = payments.filter((p) => p.trackerId === t.id).reduce((s, p) => s + p.amount, 0);
      const monthsActive = new Set(payments.filter((p) => p.trackerId === t.id).map((p) => p.month)).size;
      return { trackerId: t.id, name: t.name, icon: t.icon, color: t.color, total, monthsActive };
    })
    .sort((a, b) => b.total - a.total);

  const perPersonMap = new Map<string, { name: string; trackerName: string; trackerColor: string; months: Set<string>; total: number }>();
  for (const pay of payments) {
    const info = personById.get(pay.personId);
    if (!info) continue;
    const key = pay.personId;
    const cur = perPersonMap.get(key) ?? {
      name: info.p.name,
      trackerName: info.t.name,
      trackerColor: info.t.color,
      months: new Set<string>(),
      total: 0,
    };
    cur.months.add(pay.month);
    cur.total += pay.amount;
    perPersonMap.set(key, cur);
  }
  const perPerson = Array.from(perPersonMap.entries())
    .map(([personId, v]) => ({
      personId,
      name: v.name,
      trackerName: v.trackerName,
      trackerColor: v.trackerColor,
      monthsPaid: v.months.size,
      total: v.total,
    }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = payments.reduce((s, p) => s + p.amount, 0);

  return NextResponse.json({ year, monthly, perTracker, perPerson, grandTotal });
}
