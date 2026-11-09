"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { BellRing, DatabaseBackup, Download, Info, Languages, Moon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/lib/api";
import { useT, useLangStore } from "@/lib/i18n";
import { BrandLogo } from "./brand-logo";
import type { MonthState } from "@/lib/types";

const CURRENCIES = [
  { code: "BDT", symbol: "৳" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
];

export function SettingsView({ state }: { state: MonthState }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importPending, setImportPending] = useState<File | null>(null);
  const [notifState, setNotifState] = useState<string>(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const save = useMutation({
    mutationFn: (body: { currency?: string; currencyCode?: string; reminderDay?: number }) => api.updateSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state"] });
      toast.success(t("updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function restore() {
    if (!importPending) return;
    try {
      const text = await importPending.text();
      const payload = JSON.parse(text);
      await api.importBackup(payload);
      qc.invalidateQueries({ queryKey: ["state"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success(t("importSuccess"));
    } catch {
      toast.error(t("importFailed"));
    } finally {
      setImportPending(null);
    }
  }

  const currency = state.settings.currency;
  const code = state.settings.currencyCode;
  const current = CURRENCIES.find((c) => c.code === code);

  return (
    <div className="grid gap-5">
      <h1 className="text-xl font-extrabold tracking-tight">{t("settings")}</h1>

      {/* language */}
      <section className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Languages className="size-4 text-muted-foreground" />
          {t("language")}
        </h2>
        <ToggleGroup
          type="single"
          value={lang}
          onValueChange={(v) => v && setLang(v as "en" | "bn")}
          className="grid grid-cols-2 gap-2"
        >
          <ToggleGroupItem value="en" className="rounded-2xl border h-11 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground font-semibold">
            English
          </ToggleGroupItem>
          <ToggleGroupItem value="bn" className="rounded-2xl border h-11 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground font-semibold">
            বাংলা
          </ToggleGroupItem>
        </ToggleGroup>
      </section>

      {/* theme */}
      <section className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Moon className="size-4 text-muted-foreground" />
          {t("theme")}
        </h2>
        <ToggleGroup
          type="single"
          value={theme ?? "system"}
          onValueChange={(v) => v && setTheme(v)}
          className="grid grid-cols-3 gap-2"
        >
          <ToggleGroupItem value="light" className="rounded-2xl border h-11 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground font-semibold">
            {t("light")}
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" className="rounded-2xl border h-11 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground font-semibold">
            {t("dark")}
          </ToggleGroupItem>
          <ToggleGroupItem value="system" className="rounded-2xl border h-11 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground font-semibold">
            {t("system")}
          </ToggleGroupItem>
        </ToggleGroup>
      </section>

      {/* currency + reminder day */}
      <section className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Wallet className="size-4 text-muted-foreground" />
          {t("currency")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={code}
            onValueChange={(v) => {
              const c = CURRENCIES.find((x) => x.code === v);
              if (c) save.mutate({ currency: c.symbol, currencyCode: c.code });
            }}
          >
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid place-items-center rounded-2xl border border-primary/30 bg-accent px-3">
            <span className="money text-lg font-extrabold text-accent-foreground">{currency} · {code}</span>
          </div>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("defaultReminderDay")}</span>
          <Select
            value={String(state.settings.reminderDay)}
            onValueChange={(v) => save.mutate({ reminderDay: Number(v) })}
          >
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
        {current && currency !== current.symbol && (
          <p className="text-xs text-muted-foreground">
            {t("currency")}: {currency} ({code})
          </p>
        )}
      </section>

      {/* reminders */}
      <section className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <BellRing className="size-4 text-muted-foreground" />
          {t("reminders")}
        </h2>
        {notifState === "granted" ? (
          <p className="text-sm font-semibold text-primary">✓ {t("remindersOn")}</p>
        ) : (
          <Button
            variant="outline"
            className="rounded-2xl font-semibold"
            onClick={async () => {
              if (!("Notification" in window)) {
                toast.error(t("remindersNote"));
                return;
              }
              const res = await Notification.requestPermission();
              setNotifState(res);
              if (res === "granted") toast.success(t("remindersOn"));
            }}
          >
            {t("enableReminders")}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">{t("remindersNote")}</p>
      </section>

      {/* backup */}
      <section className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <DatabaseBackup className="size-4 text-muted-foreground" />
          {t("backupExport")}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="rounded-2xl gap-2 font-semibold">
            <a href="/api/backup" download="telapoka-backup.json">
              <Download className="size-4" />
              {t("backupExport")}
            </a>
          </Button>
          <Button variant="outline" className="rounded-2xl gap-2 font-semibold" onClick={() => fileRef.current?.click()}>
            <DatabaseBackup className="size-4" />
            {t("importData")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("backupExportDesc")} · {t("importDataDesc")}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setImportPending(f);
            e.target.value = "";
          }}
        />
      </section>

      {/* install */}
      <section className="grid gap-2 rounded-3xl border border-dashed bg-secondary/40 p-4">
        <h2 className="text-sm font-bold">📲 {t("install")}</h2>
        <p className="text-xs text-muted-foreground">{t("installNote")}</p>
      </section>

      {/* about */}
      <section className="grid place-items-center gap-2 rounded-3xl border bg-card p-6 text-center shadow-sm">
        <BrandLogo height={22} />
        <p className="text-xs text-muted-foreground">{t("tagline")} · v1.0</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          {t("madeFor")}
        </p>
      </section>

      <AlertDialog open={Boolean(importPending)} onOpenChange={(v) => !v && setImportPending(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("importData")}</AlertDialogTitle>
            <AlertDialogDescription>{t("importConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="rounded-2xl" onClick={restore}>
              {t("importData")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
