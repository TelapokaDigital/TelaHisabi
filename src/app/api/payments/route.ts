import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const METHODS = ["CASH", "BKASH", "NAGAD", "BANK", "OTHER"];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const personId = String(body.personId ?? "");
  const month = String(body.month ?? "");
  const amount = Number(body.amount);
  const method = String(body.method ?? "CASH").toUpperCase();
  const note = body.note === undefined || body.note === null || body.note === "" ? null : String(body.note).slice(0, 200);
  const paidAtRaw = String(body.paidAt ?? "");

  if (!personId) return NextResponse.json({ error: "personId is required" }, { status: 400 });
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  if (!METHODS.includes(method)) return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAtRaw))
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const person = await db.person.findUnique({ where: { id: personId } });
  if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const [y, m] = paidAtRaw.split("-").map(Number);
  const paidAt = new Date(y, m - 1, Number(paidAtRaw.split("-")[2]), 12, 0, 0);

  const payment = await db.payment.upsert({
    where: { personId_month: { personId, month } },
    update: { amount, method, paidAt, note },
    create: { personId, trackerId: person.trackerId, month, amount, method, paidAt, note },
  });

  return NextResponse.json({ payment });
}
