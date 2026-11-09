import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentMonth } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Full app state for a month: trackers -> people -> payment status, settings */
export async function GET(req: NextRequest) {
  const monthParam = req.nextUrl.searchParams.get("month") ?? "";
  const month = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonth();

  const [trackers, settings] = await Promise.all([
    db.tracker.findMany({
      orderBy: { createdAt: "asc" },
      include: { people: { orderBy: { createdAt: "asc" } } },
    }),
    db.settings.upsert({ where: { id: "global" }, update: {}, create: { id: "global" } }),
  ]);

  const personIds = trackers.flatMap((t) => t.people.map((p) => p.id));
  const payments = personIds.length
    ? await db.payment.findMany({
        where: { personId: { in: personIds } },
        orderBy: { paidAt: "desc" },
      })
    : [];

  const byPerson = new Map<string, typeof payments>();
  for (const pay of payments) {
    const list = byPerson.get(pay.personId) ?? [];
    list.push(pay);
    byPerson.set(pay.personId, list);
  }

  const out = trackers.map((t) => ({
    ...t,
    people: t.people.map((p) => {
      const list = byPerson.get(p.id) ?? [];
      return {
        ...p,
        payment: list.find((x) => x.month === month) ?? null,
        lastPaidMonth: list[0]?.month ?? null,
        lastPaidAt: list[0]?.paidAt ?? null,
      };
    }),
  }));

  return NextResponse.json({
    month,
    trackers: out,
    settings: {
      currency: settings.currency,
      currencyCode: settings.currencyCode,
      reminderDay: settings.reminderDay,
    },
  });
}
