import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface TrackerInput {
  name?: unknown;
  icon?: unknown;
  color?: unknown;
  defaultDue?: unknown;
  reminderDay?: unknown;
}

function validate(body: TrackerInput, forCreate: boolean): { error: string } | { out: Record<string, string | number> } {
  const out: Record<string, string | number> = {};

  if (body.name !== undefined || forCreate) {
    const name = String(body.name ?? "").trim();
    if (!name) return { error: "Tracker name is required" };
    out.name = name.slice(0, 60);
  }
  if (body.defaultDue !== undefined || forCreate) {
    const due = Number(body.defaultDue);
    if (!Number.isFinite(due) || due <= 0) return { error: "Default due must be greater than 0" };
    out.defaultDue = due;
  }
  if (body.icon !== undefined) out.icon = String(body.icon).slice(0, 32) || "wifi";
  if (body.color !== undefined) {
    const c = String(body.color);
    out.color = /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#E11D2E";
  }
  if (body.reminderDay !== undefined) {
    const d = Number(body.reminderDay);
    if (!Number.isInteger(d) || d < 1 || d > 28) return { error: "Reminder day must be 1-28" };
    out.reminderDay = d;
  }
  return { out };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as TrackerInput;
  const v = validate(body, true);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });

  // case-insensitive duplicate check (SQLite has no insensitive mode)
  const all = await db.tracker.findMany({ select: { name: true } });
  const wanted = String(v.out.name).toLowerCase();
  if (all.some((t) => t.name.toLowerCase() === wanted)) {
    return NextResponse.json({ error: "A tracker with this name already exists" }, { status: 400 });
  }

  const tracker = await db.tracker.create({
    data: v.out as { name: string; defaultDue: number; icon: string; color: string; reminderDay: number },
  });
  return NextResponse.json({ tracker });
}
