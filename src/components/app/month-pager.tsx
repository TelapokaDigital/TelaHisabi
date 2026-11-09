"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { monthLabel, useT, useLangStore } from "@/lib/i18n";
import { shiftMonth } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function MonthPager() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const month = useAppStore((s) => s.month);
  const setMonth = useAppStore((s) => s.setMonth);
  const nowMonth = new Date();
  const nowKey = `${nowMonth.getFullYear()}-${String(nowMonth.getMonth() + 1).padStart(2, "0")}`;
  const isCurrent = month === nowKey;

  return (
    <div className="inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
      <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
        <ChevronLeft className="size-4" />
      </Button>
      <motion.span key={month} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="min-w-28 text-center text-sm font-semibold">
        {monthLabel(month, lang, false)}
      </motion.span>
      <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Next month" disabled={isCurrent} onClick={() => setMonth(shiftMonth(month, 1))}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
