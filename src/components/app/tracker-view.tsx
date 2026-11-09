"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, MoreVertical, Pencil, Trash2, UserPlus, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TrackerBubble, PersonAvatar, PaidCheck, UnpaidDot } from "./avatars";
import { PersonDialog } from "./person-dialog";
import { MarkPaidSheet } from "./mark-paid-sheet";
import { NudgeButtons } from "./nudge-buttons";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { formatMoney, overdueInfo } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { MonthState, PersonWithStatus } from "@/lib/types";

export function TrackerView({ tracker, state }: { tracker: NonNullable<MonthState["trackers"][number]>; state: MonthState }) {
  const t = useT();
  const qc = useQueryClient();
  const { month } = state;
  const popOverlay = useAppStore((s) => s.popOverlay);
  const openPerson = useAppStore((s) => s.openPerson);
  const openTrackerDialog = useAppStore((s) => s.openTrackerDialog);

  const [payTarget, setPayTarget] = useState<PersonWithStatus | null>(null);
  const [undoTarget, setUndoTarget] = useState<PersonWithStatus | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stats = useMemo(() => {
    const exp = tracker.people.reduce((s, p) => s + p.dueAmount, 0);
    const got = tracker.people.reduce((s, p) => s + (p.payment?.amount ?? 0), 0);
    const unpaid = tracker.people.filter((p) => !p.payment);
    const overdueNow = unpaid.filter((p) => overdueInfo(tracker.reminderDay, month).overdue && overdueInfo(tracker.reminderDay, month).days < 999);
    return { exp, got, unpaid, overdueNow };
  }, [tracker, month]);

  const del = useMutation({
    mutationFn: () => api.deleteTracker(tracker.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      popOverlay();
      toast.success(t("deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unmark = useMutation({
    mutationFn: (paymentId: string) => api.unmarkPaid(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state", month] });
      setUndoTarget(null);
      toast.success(t("paymentRemoved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currency = state.settings.currency;

  return (
    <div className="grid gap-5">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Back" onClick={popOverlay}>
          <ArrowLeft className="size-5" />
        </Button>
        <TrackerBubble icon={tracker.icon} color={tracker.color} size={44} layoutId={`bubble-${tracker.id}`} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold leading-tight">{tracker.name}</h1>
          <p className="text-xs text-muted-foreground">
            {t("reminderOnDay", { n: tracker.reminderDay })} · {formatMoney(tracker.defaultDue, currency)}
            {t("perMonth")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label={t("editTracker")}>
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            <DropdownMenuItem onClick={() => openTrackerDialog(tracker.id)}>
              <Pencil className="size-4" /> {t("editTracker")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setConfirmDelete(true)} variant="destructive">
              <Trash2 className="size-4" /> {t("deleteTracker")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label={t("expected")} value={formatMoney(stats.exp, currency)} />
        <StatCard label={t("collected")} value={formatMoney(stats.got, currency)} highlight />
        <StatCard label={t("pending")} value={`${stats.unpaid.length}`} sub={t("pendingPeople")} />
      </div>

      {/* nudge row */}
      {stats.overdueNow.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-destructive/25 bg-destructive/5 p-3">
          <p className="text-sm font-semibold text-destructive">
            <BellRing className="mr-1.5 inline size-4" />
            {stats.overdueNow.length} {t("overdue")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.overdueNow.slice(0, 3).map((p) => (
              <NudgeButtons
                key={p.id}
                compact
                name={p.name}
                phone={p.phone}
                trackerName={tracker.name}
                month={month}
                amountStr={formatMoney(p.dueAmount, currency)}
              />
            ))}
          </div>
        </div>
      )}

      {/* people */}
      <section className="grid gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t("people")} · {tracker.people.length}
          </h2>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 font-semibold" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" />
            {t("addPerson")}
          </Button>
        </div>

        {tracker.people.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-3xl border border-dashed py-12 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-2xl">🧍</div>
            <div className="grid gap-1">
              <p className="font-bold">{t("noPeopleTitle")}</p>
              <p className="mx-auto max-w-[220px] text-sm text-muted-foreground">{t("noPeopleBody")}</p>
            </div>
            <Button className="rounded-2xl font-bold" onClick={() => setAddOpen(true)}>
              <UserPlus className="size-4" />
              {t("addPerson")}
            </Button>
          </div>
        ) : (
          tracker.people.map((p) => {
            const info = overdueInfo(tracker.reminderDay, month);
            const overdue = !p.payment && info.overdue && info.days < 999 && month === nowMonthKey();
            const overduePast = !p.payment && month !== nowMonthKey();
            return (
              <motion.div
                key={p.id}
                layout
                layoutId={`person-row-${p.id}`}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => openPerson(p.id)}
                  aria-label={p.name}
                >
                  <PersonAvatar name={p.name} photo={p.photo} size={44} layoutId={`avatar-${p.id}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.phone ?? t("noPhone")}
                      {overdue ? ` · ${info.days} ${t("daysOverdue")}` : ""}
                      {overduePast ? ` · ${t("overdue")}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="money text-sm font-extrabold">{formatMoney(p.dueAmount, currency)}</span>
                    {p.lastPaidMonth && !p.payment && (
                      <span className="text-[10px] text-muted-foreground">
                        {t("lastPaid")}: {p.lastPaidMonth}
                      </span>
                    )}
                  </div>
                </button>

                <span className="h-6 w-px bg-border" aria-hidden />

                {p.payment ? (
                  <button
                    className="tap shrink-0"
                    onClick={() => setUndoTarget(p)}
                    aria-label={`${t("paid")} — ${t("undoPaid")}`}
                  >
                    <PaidCheck size={30} animateKey={p.payment.id} />
                  </button>
                ) : (
                  <button
                    className="tap shrink-0"
                    onClick={() => setPayTarget(p)}
                    aria-label={t("markPaid")}
                  >
                    <UnpaidDot size={30} />
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </section>

      <MarkPaidSheet
        open={Boolean(payTarget)}
        onOpenChange={(v) => !v && setPayTarget(null)}
        person={payTarget!}
        tracker={tracker}
        month={month}
        currency={currency}
      />

      <PersonDialog open={addOpen} onOpenChange={setAddOpen} tracker={tracker} currency={currency} />

      <AlertDialog open={Boolean(undoTarget)} onOpenChange={(v) => !v && setUndoTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("undoPaid")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("markedPaid", { name: undoTarget?.name ?? "" })} — {formatMoney(undoTarget?.payment?.amount ?? 0, currency)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-destructive text-white"
              onClick={() => undoTarget?.payment && unmark.mutate(undoTarget.payment.id)}
            >
              {t("undoPaid")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTracker")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteTrackerConfirm", { name: tracker.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-destructive text-white"
              onClick={() => del.mutate()}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div
      className={`grid gap-0.5 rounded-2xl border p-3 ${highlight ? "border-primary/30 bg-accent" : "bg-card"}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="money truncate text-base font-extrabold">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

function nowMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
