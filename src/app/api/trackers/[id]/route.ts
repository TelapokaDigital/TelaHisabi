import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const sameValidation = (body: Record<string, unknown>) => {
  const out: Record<string, string | number> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return { error: "Tracker name is required" as const };
    out.name = name.slice(0, 60);
  }
  if (body.defaultDue !== undefined) {
    const due = Number(body.defaultDue);
    if (!Number.isFinite(due) || due <= 0) return { error: "Default due must be greater than 0" as const };
    out.defaultDue = due;
  }
  if (body.icon !== undefined) out.icon = String(body.icon).slice(0, 32) || "wifi";
  if (body.color !== undefined) {
    const c = String(body.color);
    out.color = /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#E11D2E";
  }
  if (body.reminderDay !== undefined) {
    const d = Number(body.reminderDay);
    if (!Number.isInteger(d) || d < 1 || d > 28) return { error: "Reminder day must be 1-28" as const };
    out.reminderDay = d;
  }
  return { out };
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const v = sameValidation(body);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });

  const existing = await db.tracker.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tracker not found" }, { status: 404 });

  if (v.out.name !== undefined) {
    const all = await db.tracker.findMany({ where: { id: { not: id } }, select: { name: true } });
    const wanted = String(v.out.name).toLowerCase();
    if (all.some((t) => t.name.toLowerCase() === wanted)) {
      return NextResponse.json({ error: "A tracker with this name already exists" }, { status: 400 });
    }
  }

  const tracker = await db.tracker.update({ where: { id }, data: v.out });
  return NextResponse.json({ tracker });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.tracker.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
