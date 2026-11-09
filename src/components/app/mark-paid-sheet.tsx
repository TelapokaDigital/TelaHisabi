"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS, type PersonWithStatus, type PaymentMethod, type TrackerDTO } from "@/lib/types";
import { api } from "@/lib/api";
import { formatMoney, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Banknote, Landmark, Smartphone, Wallet, CircleDollarSign } from "lucide-react";

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  CASH: <Banknote className="size-4" />,
  BKASH: <Smartphone className="size-4" />,
  NAGAD: <Smartphone className="size-4" />,
  BANK: <Landmark className="size-4" />,
  OTHER: <Wallet className="size-4" />,
};

export function MarkPaidSheet({
  open,
  onOpenChange,
  person,
  tracker,
  month,
  currency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  person: PersonWithStatus | null;
  tracker: TrackerDTO;
  month: string;
  currency: string;
}) {
  const t = useT();
  // inner form remounts per person+month, so fields initialize fresh from props
  const session = person ? `${person.id}-${month}-${person.payment?.id ?? "new"}` : "none";
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl">
        <div className="mx-auto w-full max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="pb-2 text-left">
            <DrawerTitle className="text-lg font-bold">{t("recordPayment")}</DrawerTitle>
          </DrawerHeader>
          {open && person && (
            <MarkPaidForm
              key={session}
              person={person}
              tracker={tracker}
              month={month}
              currency={currency}
              onDone={() => onOpenChange(false)}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MarkPaidForm({
  person,
  tracker,
  month,
  currency,
  onDone,
}: {
  person: PersonWithStatus;
  tracker: TrackerDTO;
  month: string;
  currency: string;
  onDone: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(String(person.payment ? person.payment.amount : person.dueAmount));
  const [method, setMethod] = useState<PaymentMethod>(person.payment?.method ?? "CASH");
  const [date, setDate] = useState(person.payment ? person.payment.paidAt.slice(0, 10) : todayISO());
  const [note, setNote] = useState(person.payment?.note ?? "");

  const methodLabels: Record<PaymentMethod, string> = {
    CASH: t("cash"),
    BKASH: t("bkash"),
    NAGAD: t("nagad"),
    BANK: t("bank"),
    OTHER: t("other"),
  };

  const save = useMutation({
    mutationFn: () =>
      api.markPaid({
        personId: person.id,
        month,
        amount: Number(amount),
        method,
        paidAt: date,
        note: note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state", month] });
      qc.invalidateQueries({ queryKey: ["history", person.id] });
      onDone();
      navigator.vibrate?.(18);
      toast.success(t("markedPaid", { name: person.name }), {
        description: `${formatMoney(Number(amount), currency)} · ${methodLabels[method]}`,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 pb-2 pt-1">
      <div className="grid gap-1.5">
        <p className="text-sm text-muted-foreground">
          {person.name} · {tracker.name} · {month}
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pay-amount">{t("amount")}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
            {currency}
          </span>
          <Input
            id="pay-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="money pl-9 h-12 rounded-2xl text-lg font-semibold"
            autoFocus
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>{t("method")}</Label>
        <ToggleGroup
          type="single"
          value={method}
          onValueChange={(v) => v && setMethod(v as PaymentMethod)}
          className="grid grid-cols-3 gap-2"
        >
          {PAYMENT_METHODS.map((m) => (
            <ToggleGroupItem
              key={m}
              value={m}
              aria-label={methodLabels[m]}
              className="rounded-xl border data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground h-10 gap-1.5"
            >
              {methodIcons[m]}
              <span className="text-xs font-medium">{methodLabels[m]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="pay-date">{t("date")}</Label>
          <Input id="pay-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-2xl" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pay-note">{t("note")}</Label>
          <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} className="h-12 rounded-2xl" />
        </div>
      </div>

      <Button
        size="lg"
        className="rounded-2xl text-base font-bold h-12"
        disabled={save.isPending || !(Number(amount) > 0)}
        onClick={() => save.mutate()}
      >
        <CircleDollarSign className="size-5" />
        {t("savePayment")} {Number(amount) > 0 ? formatMoney(Number(amount), currency) : ""}
      </Button>
    </div>
  );
}
