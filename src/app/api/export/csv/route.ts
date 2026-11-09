import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Full payment ledger as CSV (Excel-friendly). */
export async function GET() {
  const payments = await db.payment.findMany({
    orderBy: [{ month: "desc" }, { paidAt: "desc" }],
    include: { person: { include: { tracker: true } } },
  });
  const settings = await db.settings.upsert({ where: { id: "global" }, update: {}, create: { id: "global" } });

  const header = ["Month", "Paid on", "Tracker", "Person", `Amount (${settings.currencyCode})`, "Method", "Note"];
  const lines = [header.map(csvCell).join(",")];
  for (const p of payments) {
    lines.push(
      [
        p.month,
        p.paidAt.toISOString().slice(0, 10),
        p.person.tracker.name,
        p.person.name,
        p.amount,
        p.method,
        p.note ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="telapoka-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
