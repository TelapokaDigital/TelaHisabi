"use client";

import { motion } from "framer-motion";
import { Home, PieChart, Settings } from "lucide-react";
import { useAppStore, type Tab } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const t = useT();
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);

  const items: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "home", icon: <Home className="size-5" />, label: t("home") },
    { id: "reports", icon: <PieChart className="size-5" />, label: t("reports") },
    { id: "settings", icon: <Settings className="size-5" />, label: t("settings") },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 backdrop-blur-lg"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3 px-2 pt-1.5">
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="relative grid place-items-center gap-0.5 rounded-2xl py-1.5 tap"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-x-3 top-0.5 bottom-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 ${active ? "text-accent-foreground" : "text-muted-foreground"}`}>
                {item.icon}
              </span>
              <span
                className={`relative z-10 text-[11px] font-semibold ${
                  active ? "text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
