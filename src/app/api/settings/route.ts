import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await db.settings.upsert({ where: { id: "global" }, update: {}, create: { id: "global" } });
  return NextResponse.json({
    settings: {
      currency: settings.currency,
      currencyCode: settings.currencyCode,
      reminderDay: settings.reminderDay,
    },
  });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, string | number> = {};

  if (body.currency !== undefined) {
    const c = String(body.currency).trim();
    if (!c || c.length > 4) return NextResponse.json({ error: "Invalid currency symbol" }, { status: 400 });
    data.currency = c;
  }
  if (body.currencyCode !== undefined) {
    const c = String(body.currencyCode).trim().toUpperCase().slice(0, 3);
    if (!/^[A-Z]{3}$/.test(c)) return NextResponse.json({ error: "Invalid currency code" }, { status: 400 });
    data.currencyCode = c;
  }
  if (body.reminderDay !== undefined) {
    const d = Number(body.reminderDay);
    if (!Number.isInteger(d) || d < 1 || d > 28)
      return NextResponse.json({ error: "Reminder day must be 1-28" }, { status: 400 });
    data.reminderDay = d;
  }

  const settings = await db.settings.upsert({
    where: { id: "global" },
    update: data,
    create: { id: "global", ...data },
  });

  return NextResponse.json({
    settings: {
      currency: settings.currency,
      currencyCode: settings.currencyCode,
      reminderDay: settings.reminderDay,
    },
  });
}
