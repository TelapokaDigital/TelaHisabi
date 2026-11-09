import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const trackerId = String(body.trackerId ?? "");
  const name = String(body.name ?? "").trim();
  const phone = body.phone === undefined || body.phone === null || body.phone === "" ? null : String(body.phone).trim();
  const photo = body.photo === undefined || body.photo === null || body.photo === "" ? null : String(body.photo);
  const dueAmount = Number(body.dueAmount);

  if (!trackerId) return NextResponse.json({ error: "trackerId is required" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!Number.isFinite(dueAmount) || dueAmount <= 0)
    return NextResponse.json({ error: "Due amount must be greater than 0" }, { status: 400 });
  if (photo && photo.length > 300_000)
    return NextResponse.json({ error: "Photo too large" }, { status: 400 });
  if (phone && !/^[+\d][\d\s-]{5,19}$/.test(phone))
    return NextResponse.json({ error: "Phone number looks invalid" }, { status: 400 });

  const tracker = await db.tracker.findUnique({ where: { id: trackerId } });
  if (!tracker) return NextResponse.json({ error: "Tracker not found" }, { status: 404 });

  const siblings = await db.person.findMany({ where: { trackerId }, select: { name: true } });
  if (siblings.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "This name already exists in this tracker" }, { status: 400 });
  }

  const person = await db.person.create({
    data: {
      trackerId,
      name: name.slice(0, 80),
      phone: phone ? phone.slice(0, 24) : null,
      photo: photo ?? null,
      dueAmount,
    },
  });
  return NextResponse.json({ person });
}
