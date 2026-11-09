import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Full month-by-month payment history of one person (desc). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await db.person.findUnique({ where: { id } });
  if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const payments = await db.payment.findMany({
    where: { personId: id },
    orderBy: { month: "desc" },
  });

  // build a continuous range from first payment month to current month
  const now = new Date();
  const curKey = now.getFullYear() * 12 + now.getMonth();
  const oldest = payments[payments.length - 1]?.month;
  const entries: { month: string; payment: (typeof payments)[number] | null }[] = [];

  if (oldest) {
    const [oy, om] = oldest.split("-").map(Number);
    const startKey = oy * 12 + (om - 1);
    for (let k = curKey; k >= startKey; k--) {
      const y = Math.floor(k / 12);
      const m = (k % 12) + 1;
      const month = `${y}-${String(m).padStart(2, "0")}`;
      entries.push({ month, payment: payments.find((p) => p.month === month) ?? null });
    }
  }

  return NextResponse.json({ entries });
}
