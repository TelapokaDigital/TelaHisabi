import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET: full JSON backup / POST: restore (replaces everything) */
export async function GET() {
  const [trackers, settings] = await Promise.all([
    db.tracker.findMany({ include: { people: { include: { payments: true } } } }),
    db.settings.upsert({ where: { id: "global" }, update: {}, create: { id: "global" } }),
  ]);
  return NextResponse.json({
    app: "TELAPOKA",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    trackers,
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as BackupPayload | null;
  if (!payload || payload.app !== "TELAPOKA" || !Array.isArray(payload.trackers)) {
    return NextResponse.json({ error: "Invalid backup file" }, { status: 400 });
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.payment.deleteMany();
      await tx.person.deleteMany();
      await tx.tracker.deleteMany();

      for (const t of payload.trackers) {
        if (!t?.id || !t.name || !Number.isFinite(Number(t.defaultDue))) {
          throw new Error("bad tracker");
        }
        await tx.tracker.create({
          data: {
            id: String(t.id),
            name: String(t.name).slice(0, 60),
            icon: String(t.icon ?? "wifi").slice(0, 32),
            color: /^#[0-9a-fA-F]{6}$/.test(String(t.color)) ? String(t.color) : "#E11D2E",
            defaultDue: Number(t.defaultDue),
            reminderDay: clampDay(t.reminderDay),
            createdAt: safeDate(t.createdAt),
            updatedAt: safeDate(t.updatedAt),
            people: {
              create: (Array.isArray(t.people) ? t.people : []).map((p: BackupPerson) => ({
                id: String(p.id),
                name: String(p.name).slice(0, 80),
                phone: p.phone ?? null,
                photo: typeof p.photo === "string" && p.photo.length <= 300_000 ? p.photo : null,
                dueAmount: Number(p.dueAmount) || 0,
                createdAt: safeDate(p.createdAt),
                payments: {
                  create: (Array.isArray(p.payments) ? p.payments : []).map((pay: BackupPayment) => ({
                    id: String(pay.id),
                    trackerId: String(t.id),
                    month: /^\d{4}-\d{2}$/.test(String(pay.month)) ? String(pay.month) : "1970-01",
                    amount: Number(pay.amount) || 0,
                    method: ["CASH", "BKASH", "NAGAD", "BANK", "OTHER"].includes(String(pay.method))
                      ? String(pay.method)
                      : "CASH",
                    paidAt: safeDate(pay.paidAt),
                    note: pay.note ?? null,
                  })),
                },
              })),
            },
          },
        });
      }

      if (payload.settings) {
        const s = payload.settings;
        await tx.settings.upsert({
          where: { id: "global" },
          update: {
            currency: String(s.currency ?? "৳").slice(0, 4) || "৳",
            currencyCode: String(s.currencyCode ?? "BDT").toUpperCase().slice(0, 3) || "BDT",
            reminderDay: clampDay(s.reminderDay),
          },
          create: { id: "global" },
        });
      }
    });
  } catch {
    return NextResponse.json({ error: "Backup file structure is invalid" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

function clampDay(v: unknown): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 28 ? n : 5;
}

function safeDate(v: unknown): Date {
  const d = new Date(String(v ?? ""));
  return isNaN(d.getTime()) ? new Date() : d;
}

interface BackupPayment {
  id: string;
  month: string;
  amount: number;
  method: string;
  paidAt: string;
  note?: string | null;
}
interface BackupPerson {
  id: string;
  name: string;
  phone?: string | null;
  photo?: string | null;
  dueAmount: number;
  createdAt?: string;
  payments?: BackupPayment[];
}
interface BackupTracker {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  defaultDue: number;
  reminderDay?: number;
  createdAt?: string;
  updatedAt?: string;
  people?: BackupPerson[];
}
interface BackupPayload {
  app: string;
  version: number;
  trackers: BackupTracker[];
  settings?: { currency?: string; currencyCode?: string; reminderDay?: number };
}
