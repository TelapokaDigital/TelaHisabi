import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const existing = await db.person.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const data: Record<string, string | number | null> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const siblings = await db.person.findMany({
      where: { trackerId: existing.trackerId, id: { not: id } },
      select: { name: true },
    });
    if (siblings.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: "This name already exists in this tracker" }, { status: 400 });
    }
    data.name = name.slice(0, 80);
  }
  if (body.dueAmount !== undefined) {
    const due = Number(body.dueAmount);
    if (!Number.isFinite(due) || due <= 0)
      return NextResponse.json({ error: "Due amount must be greater than 0" }, { status: 400 });
    data.dueAmount = due;
  }
  if (body.phone !== undefined) {
    const phone = body.phone === null || body.phone === "" ? null : String(body.phone).trim();
    if (phone && !/^[+\d][\d\s-]{5,19}$/.test(phone))
      return NextResponse.json({ error: "Phone number looks invalid" }, { status: 400 });
    data.phone = phone ? phone.slice(0, 24) : null;
  }
  if (body.photo !== undefined) {
    const photo = body.photo === null || body.photo === "" ? null : String(body.photo);
    if (photo && photo.length > 300_000) return NextResponse.json({ error: "Photo too large" }, { status: 400 });
    data.photo = photo;
  }

  const person = await db.person.update({ where: { id }, data });
  return NextResponse.json({ person });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.person.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
