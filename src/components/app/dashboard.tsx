"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthPager } from "./month-pager";
import { CountUp, ProgressRing } from "./progress-ring";
import { PersonAvatar, TrackerBubble, UnpaidDot } from "./avatars";
import { useT, useLangStore } from "@/lib/i18n";
import { daysLeftInMonth, formatMoney, overdueInfo, todayISO } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { MonthState, PersonWithStatus, TrackerWithPeople } from "@/lib/types";

interface PendingItem {
  person: PersonWithStatus;
  tracker: TrackerWithPeople;
  overdue: boolean;
  days: number;
}

export function Dashboard({ state }: { state: MonthState }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const { month } = state;
  const openTracker = useAppStore((s) => s.openTracker);
  const openPerson = useAppStore((s) => s.openPerson);

  const { expected, collected, pendingList } = useMemo(() => {
    let expected = 0;
    let collected = 0;
    const pendingList: PendingItem[] = [];
    for (const tr of state.trackers) {
      for (const p of tr.people) {
        expected += p.dueAmount;
        if (p.payment) collected += p.payment.amount;
        else {
          const info = overdueInfo(tr.reminderDay, month);
          pendingList.push({ person: p, tracker: tr, overdue: info.overdue && info.days < 999, days: info.days });
        }
      }
    }
    pendingList.sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.days - a.days);
    return { expected, collected, pendingList };
  }, [state, month]);

  const percent = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  const overdueCount = pendingList.filter((p) => p.overdue).length;
  const daysLeft = daysLeftInMonth(month);

  // browser reminder for overdue people (fires once per day while app is open)
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (overdueCount === 0) return;
    const today = todayISO();
    if (localStorage.getItem("telapoka.lastRemind") === today) return;
    localStorage.setItem("telapoka.lastRemind", today);
    try {
      new Notification("TELAPOKA", {
        body:
          lang === "bn"
            ? `${overdueCount} জনের পেমেন্ট বাকি আছে — নাজ পাঠান।`
            : `${overdueCount} ${overdueCount === 1 ? "person is" : "people are"} overdue — send a nudge.`,
      });
    } catch {
      /* some browsers require SW */
    }
  }, [overdueCount, lang]);

  if (state.trackers.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">{month === nowMonthKey() ? t("home") : ""}</h1>
        <MonthPager />
      </div>

      {/* hero */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-primary/25"
        style={{ background: "linear-gradient(135deg, #E11D2E 0%, #B01020 100%)" }}
      >
        <div className="absolute -right-10 -top-16 size-44 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-20 -left-8 size-36 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex items-center justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-sm font-medium text-white/85">{t("collected")}</span>
            <span className="text-3xl font-extrabold leading-none">
              <CountUp value={collected} prefix={state.settings.currency} />
            </span>
            <span className="text-sm text-white/80 money">
              {t("ofCollected")} {formatMoney(expected, state.settings.currency)} {t("expected").toLowerCase()}
            </span>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
              {percent}% {t("collectedOfExpected")}
            </span>
          </div>
          <ProgressRing percent={percent} size={120} stroke={11}>
            <div className="grid text-center">
              <span className="text-2xl font-extrabold">{percent}%</span>
              {daysLeft > 0 && <span className="text-[11px] font-medium text-white/85">{daysLeft} {t("daysLeft")}</span>}
            </div>
          </ProgressRing>
        </div>
      </motion.section>

      {/* attention banner */}
      {pendingList.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t("needsAttention")} · {pendingList.length} {t("pendingPeople")}
            </h2>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
                <AlertCircle className="size-3.5" />
                {overdueCount} {t("overdue")}
              </span>
            )}
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {pendingList.map(({ person, tracker, overdue, days }) => (
              <motion.button
                key={person.id}
                layoutId={`pending-${person.id}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => openPerson(person.id)}
                className="flex min-w-44 shrink-0 flex-col gap-2 rounded-2xl border bg-card p-3 text-left shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <PersonAvatar name={person.name} photo={person.photo} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{tracker.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="money text-xs font-semibold text-muted-foreground">
                    {formatMoney(person.dueAmount, state.settings.currency)}
                  </span>
                  {overdue ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                      {month === nowMonthKey() ? `${days} ${t("daysOverdue")}` : t("overdue")}
                    </span>
                  ) : (
                    <UnpaidDot size={18} />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* trackers */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {t("trackers")} · {state.trackers.length}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {state.trackers.map((tr) => {
            const exp = tr.people.reduce((s, p) => s + p.dueAmount, 0);
            const got = tr.people.reduce((s, p) => s + (p.payment?.amount ?? 0), 0);
            const pct = exp > 0 ? Math.round((got / exp) * 100) : 0;
            const paidCount = tr.people.filter((p) => p.payment).length;
            return (
              <motion.button
                key={tr.id}
                layoutId={`card-${tr.id}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => openTracker(tr.id)}
                className="flex flex-col gap-3 rounded-3xl border bg-card p-4 text-left shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <TrackerBubble icon={tr.icon} color={tr.color} size={44} layoutId={`bubble-${tr.id}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{tr.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tr.people.length} {t("people").toLowerCase()} · {paidCount}/{tr.people.length} {t("paid").toLowerCase()}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="money text-lg font-extrabold">{formatMoney(got, state.settings.currency)}</span>
                    <span className="money text-xs text-muted-foreground">
                      {t("expected")} {formatMoney(exp, state.settings.currency)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: tr.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}

function nowMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function EmptyDashboard() {
  const t = useT();
  const openDialog = useAppStore((s) => s.openTrackerDialog);
  return (
    <div className="grid place-items-center gap-6 py-16 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="grid size-24 place-items-center rounded-3xl bg-accent text-accent-foreground"
      >
        <Users className="size-10" />
      </motion.div>
      <div className="grid gap-2">
        <h2 className="text-xl font-extrabold">{t("noTrackersTitle")}</h2>
        <p className="max-w-xs text-sm text-muted-foreground">{t("noTrackersBody")}</p>
      </div>
      <Button size="lg" className="rounded-2xl font-bold shadow-lg shadow-primary/30" onClick={() => openDialog(null)}>
        <Plus className="size-5" />
        {t("addTracker")}
      </Button>
    </div>
  );
}
