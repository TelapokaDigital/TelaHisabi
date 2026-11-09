"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Plus, Sun, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/app/brand-logo";
import { BottomNav } from "@/components/app/bottom-nav";
import { Dashboard } from "@/components/app/dashboard";
import { TrackerView } from "@/components/app/tracker-view";
import { PersonView } from "@/components/app/person-view";
import { ReportsView } from "@/components/app/reports-view";
import { SettingsView } from "@/components/app/settings-view";
import { TrackerDialog } from "@/components/app/tracker-dialog";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useLangStore } from "@/lib/i18n";

const overlayMotion = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { type: "spring" as const, stiffness: 320, damping: 34 },
};

export default function Page() {
  const tab = useAppStore((s) => s.tab);
  const month = useAppStore((s) => s.month);
  const overlays = useAppStore((s) => s.overlays);
  const trackerDialog = useAppStore((s) => s.trackerDialog);
  const closeTrackerDialog = useAppStore((s) => s.closeTrackerDialog);
  const openTrackerDialog = useAppStore((s) => s.openTrackerDialog);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const { resolvedTheme, setTheme } = useTheme();

  const [online, setOnline] = useState(true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const state = useQuery({
    queryKey: ["state", month],
    queryFn: () => api.monthState(month),
  });

  const trackerForDialog = trackerDialog.trackerId
    ? state.data?.trackers.find((t) => t.id === trackerDialog.trackerId) ?? null
    : null;

  const trackerOverlay = overlays[0]?.type === "tracker" ? overlays[0] : null;
  const lastOverlay = overlays.length ? overlays[overlays.length - 1] : null;
  const personIdForOverlay = lastOverlay?.type === "person" ? lastOverlay.id : null;

  const trackerForOverlay =
    trackerOverlay ? state.data?.trackers.find((t) => t.id === trackerOverlay.id) : undefined;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {/* header */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <BrandLogo height={17} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="rounded-full border px-2.5 py-1 text-[11px] font-bold tap"
              aria-label="Toggle language"
            >
              {lang === "en" ? "EN" : "বাং"}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {!online && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-amber-500/15 text-amber-700 dark:text-amber-400"
            >
              <p className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold">
                <WifiOff className="size-3.5" /> {lang === "en" ? "You're offline — showing last data" : "আপনি অফলাইনে"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* content */}
      <main className="relative flex-1 px-4 pb-32 pt-4">
        {state.isLoading ? (
          <div className="grid gap-4 pt-2">
            <Skeleton className="h-8 w-40 rounded-2xl" />
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
          </div>
        ) : state.isError ? (
          <div className="grid place-items-center gap-4 py-20 text-center">
            <p className="text-4xl">📡</p>
            <p className="text-sm text-muted-foreground">
              {String(state.error) || "Could not load data"}
            </p>
            <Button className="rounded-2xl font-bold" onClick={() => state.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          state.data && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {tab === "home" && <Dashboard state={state.data} />}
                {tab === "reports" && <ReportsView state={state.data} />}
                {tab === "settings" && <SettingsView state={state.data} />}
              </motion.div>
            </AnimatePresence>
          )
        )}
      </main>

      {/* FAB */}
      <AnimatePresence>
        {tab === "home" && overlays.length === 0 && state.data && state.data.trackers.length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-lg px-4"
          >
            <div className="flex justify-end">
              <Button
                size="icon"
                aria-label="Add tracker"
                className="size-14 rounded-2xl shadow-xl shadow-primary/40"
                onClick={() => openTrackerDialog(null)}
              >
                <Plus className="size-6" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* overlays: tracker -> person, full-screen springs */}
      <AnimatePresence>
        {trackerOverlay && trackerForOverlay && state.data && (
          <motion.div
            key="overlay-tracker"
            {...overlayMotion}
            className="pb-safe fixed inset-0 z-40 overflow-y-auto bg-background px-4 py-4"
          >
            <div className="mx-auto max-w-lg">
              <TrackerView tracker={trackerForOverlay} state={state.data} />
            </div>
          </motion.div>
        )}
        {personIdForOverlay && state.data && (
          <motion.div key="overlay-person" {...overlayMotion} className="pb-safe fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-4">
            <div className="mx-auto max-w-lg">
              <PersonView personId={personIdForOverlay} state={state.data} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* global tracker dialog (create / edit) */}
      {state.data && (
        <TrackerDialog
          open={trackerDialog.open}
          onOpenChange={(v) => (v ? openTrackerDialog(trackerDialog.trackerId) : closeTrackerDialog())}
          tracker={trackerForDialog}
          defaultReminderDay={state.data.settings.reminderDay}
          currency={state.data.settings.currency}
        />
      )}

      <BottomNav />
    </div>
  );
}
