"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Phone, History } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PersonAvatar, PaidCheck, UnpaidDot } from "./avatars";
import { PersonDialog } from "./person-dialog";
import { MarkPaidSheet } from "./mark-paid-sheet";
import { NudgeButtons } from "./nudge-buttons";
import { api } from "@/lib/api";
import { useT, monthLabel, useLangStore } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { MonthState } from "@/lib/types";

export function PersonView({ personId, state }: { personId: string; state: MonthState }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const qc = useQueryClient();
  const popOverlay = useAppStore((s) => s.popOverlay);
  const { month } = state;

  // find person in current state (tracker included)
  let person: MonthState["trackers"][number]["people"][number] | null = null;
  let tracker: MonthState["trackers"][number] | null = null;
  for (const tr of state.trackers) {
    const found = tr.people.find((p) => p.id === personId);
    if (found) {
      person = found;
      tracker = tr;
      break;
    }
  }

  const history = useQuery({
    queryKey: ["history", personId],
    queryFn: () => api.personHistory(personId),
    enabled: Boolean(person),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [payMonth, setPayMonth] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const del = useMutation({
    mutationFn: () => api.deletePerson(personId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      popOverlay();
      toast.success(t("deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!person || !tracker) {
    return (
      <div className="grid gap-3 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const currency = state.settings.currency;
  const entries = history.data?.entries ?? [];
  const totalPaid = entries.reduce((s, e) => s + (e.payment?.amount ?? 0), 0);
  const monthsPaid = entries.filter((e) => e.payment).length;

  return (
    <div className="grid gap-5">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Back" onClick={popOverlay}>
          <ArrowLeft className="size-5" />
        </Button>
        <PersonAvatar name={person.name} photo={person.photo} size={46} layoutId={`avatar-${person.id}`} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold leading-tight">{person.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {tracker.name} · {t("dueAmount")} {formatMoney(person.dueAmount, currency)}
            {t("perMonth")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full"
          aria-label={t("editPerson")}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full text-destructive"
          aria-label={t("deletePerson")}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-4.5" />
        </Button>
      </header>

      {/* contact + nudge */}
      <div className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-muted-foreground" />
            <span className="money font-semibold">{person.phone ?? t("noPhone")}</span>
          </div>
          <NudgeButtons
            compact={false}
            name={person.name}
            phone={person.phone}
            trackerName={tracker.name}
            month={month}
            amountStr={formatMoney(person.dueAmount, currency)}
          />
        </div>
        {!person.payment && person.lastPaidMonth && (
          <p className="text-xs text-muted-foreground">
            {t("lastPaid")}: {monthLabel(person.lastPaidMonth, lang, true)}
          </p>
        )}
        {!person.lastPaidMonth && <p className="text-xs text-muted-foreground">{t("neverPaid")}</p>}
        {!person.payment && (
          <Button className="rounded-2xl font-bold" onClick={() => setPayMonth(month)}>
            {t("markPaid")} · {monthLabel(month, lang)}
          </Button>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="grid gap-0.5 rounded-2xl border bg-card p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("totalPaid")}</span>
          <span className="money text-base font-extrabold">{formatMoney(totalPaid, currency)}</span>
        </div>
        <div className="grid gap-0.5 rounded-2xl border bg-card p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("monthsPaid")}</span>
          <span className="money text-base font-extrabold">{monthsPaid}</span>
        </div>
        <div className="grid gap-0.5 rounded-2xl border p-3 border-primary/30 bg-accent">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("thisMonth")}</span>
          <span className={`money text-base font-extrabold ${person.payment ? "text-primary" : "text-destructive"}`}>
            {person.payment ? t("paid") : t("unpaid")}
          </span>
        </div>
      </div>

      {/* history */}
      <section className="grid gap-2.5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <History className="size-4" />
          {t("history")}
        </h2>
        {history.isLoading ? (
          <div className="grid gap-2">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("neverPaid")}</div>
        ) : (
          entries.map(({ month: m, payment }) => (
            <motion.div
              key={m}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                payment ? "bg-card shadow-sm" : "border-dashed bg-secondary/40"
              }`}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-center">
                <span className="text-[10px] font-bold leading-none uppercase">{monthLabel(m, lang).split(" ")[0]}</span>
                <span className="money text-xs font-extrabold leading-tight">{m.split("-")[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                {payment ? (
                  <>
                    <p className="money font-extrabold">{formatMoney(payment.amount, currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.method} · {payment.paidAt.slice(0, 10)}
                      {payment.note ? ` · ${payment.note}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-destructive text-sm">{t("unpaid")}</p>
                )}
              </div>
              {payment ? (
                <PaidCheck size={26} animateKey={payment.id} />
              ) : (
                <Button variant="outline" size="sm" className="rounded-full text-xs font-bold" onClick={() => setPayMonth(m)}>
                  {t("markPaid")}
                </Button>
              )}
            </motion.div>
          ))
        )}
      </section>

      <PersonDialog open={editOpen} onOpenChange={setEditOpen} tracker={tracker} person={person} currency={currency} />
      <MarkPaidSheet
        open={Boolean(payMonth)}
        onOpenChange={(v) => !v && setPayMonth(null)}
        person={person}
        tracker={tracker}
        month={payMonth ?? month}
        currency={currency}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePerson")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deletePersonConfirm", { name: person.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="rounded-2xl bg-destructive text-white" onClick={() => del.mutate()}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
