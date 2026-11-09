"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { TrackerDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMOJIS = ["📶", "🏠", "⚡", "🔥", "💧", "💡", "🌐", "🛠️", "🚗", "🧾", "🎬", "🛋️", "☕", "🏋️", "📱", "🧹"];
const COLORS = ["#E11D2E", "#E11D48", "#F97316", "#F59E0B", "#10B981", "#14B8A6", "#8B5CF6", "#334155"];

export function TrackerDialog({
  open,
  onOpenChange,
  tracker,
  defaultReminderDay,
  currency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tracker?: TrackerDTO | null;
  defaultReminderDay: number;
  currency: string;
}) {
  const editing = Boolean(tracker);
  const session = tracker?.id ?? "new";
  const title = useT()(editing ? "editTracker" : "addTracker");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">tracker</DialogDescription>
        </DialogHeader>
        {open && (
          <TrackerForm
            key={session}
            tracker={tracker ?? null}
            defaultReminderDay={defaultReminderDay}
            currency={currency}
            editing={editing}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TrackerForm({
  tracker,
  defaultReminderDay,
  currency,
  editing,
  onDone,
}: {
  tracker: TrackerDTO | null;
  defaultReminderDay: number;
  currency: string;
  editing: boolean;
  onDone: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();

  const [name, setName] = useState(tracker?.name ?? "");
  const [icon, setIcon] = useState(tracker?.icon ?? EMOJIS[0]);
  const [color, setColor] = useState(tracker?.color ?? COLORS[0]);
  const [due, setDue] = useState(tracker ? String(tracker.defaultDue) : "");
  const [reminderDay, setReminderDay] = useState(String(tracker?.reminderDay ?? defaultReminderDay));
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        icon,
        color,
        defaultDue: Number(due),
        reminderDay: Number(reminderDay),
      };
      if (editing && tracker) return api.updateTracker(tracker.id, body);
      return api.createTracker(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      onDone();
      toast.success(editing ? t("updated") : t("addedTracker"));
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError(t("required"));
      return;
    }
    if (!(Number(due) > 0)) {
      setError(t("amountMustBePositive"));
      return;
    }
    save.mutate();
  }

  return (
    <>
      <div className="grid gap-4 py-1">
        <div className="grid gap-1.5">
          <Label htmlFor="tr-name">{t("trackerName")}</Label>
          <Input
            id="tr-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("trackerNamePh")}
            className="h-12 rounded-2xl"
            maxLength={60}
            autoFocus
          />
        </div>

        <div className="grid gap-1.5">
          <Label>{t("icon")}</Label>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={e}
                onClick={() => setIcon(e)}
                className={cn(
                  "grid h-10 place-items-center rounded-xl text-xl transition-all",
                  icon === e ? "bg-accent ring-2 ring-primary scale-105" : "bg-secondary/60 hover:bg-secondary"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>{t("color")}</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                className={cn(
                  "size-9 rounded-full transition-all",
                  color === c ? "ring-2 ring-offset-2 ring-foreground scale-105 ring-offset-background" : ""
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="tr-due">
              {t("defaultDue")} ({currency})
            </Label>
            <Input
              id="tr-due"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder="500"
              className="money h-12 rounded-2xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("reminderDay")}</Label>
            <Select value={reminderDay} onValueChange={setReminderDay}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 28 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" className="rounded-2xl" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button className="rounded-2xl font-bold" onClick={submit} disabled={save.isPending}>
          {editing ? t("update") : t("save")}
        </Button>
      </DialogFooter>
    </>
  );
}
