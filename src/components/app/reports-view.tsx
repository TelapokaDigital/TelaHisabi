"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeft, ChevronRight, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useT, monthLabel, useLangStore } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { CountUp } from "./progress-ring";
import { formatMoney } from "@/lib/format";
import type { MonthState } from "@/lib/types";

export function ReportsView({ state }: { state: MonthState }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const month = useAppStore((s) => s.month);
  const year = Number(month.split("-")[0]);
  const setMonth = useAppStore((s) => s.setMonth);

  const reports = useQuery({
    queryKey: ["reports", year],
    queryFn: () => api.reports(year),
  });

  const currency = state.settings.currency;
  const code = state.settings.currencyCode;

  function exportPdf() {
    const data = reports.data;
    if (!data) return;
    void (async () => {
      const { default: JsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new JsPDF();
      doc.setFontSize(22);
      doc.setTextColor(225, 29, 46);
      doc.text("TELAPOKA", 14, 18);
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text(`Collection Report ${year}`, 14, 26);

      autoTable(doc, {
        startY: 34,
        head: [["Month", `Total (${code})`]],
        body: data.monthly.filter((m) => m.total > 0).map((m) => [monthLabel(m.month, "en", true), m.total.toLocaleString()]),
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [225, 29, 46] },
      });

      autoTable(doc, {
        head: [["Tracker", "Months active", `Total (${code})`]],
        body: data.perTracker.map((x) => [x.name, String(x.monthsActive), x.total.toLocaleString()]),
        theme: "striped",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [40, 40, 40] },
      });

      autoTable(doc, {
        head: [["Person", "Tracker", "Months paid", `Total (${code})`]],
        body: data.perPerson.map((p) => [p.name, p.trackerName, String(p.monthsPaid), p.total.toLocaleString()]),
        theme: "striped",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [40, 40, 40] },
      });

      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Grand total ${year}: ${code} ${data.grandTotal.toLocaleString()}`, 14, doc.internal.pageSize.getHeight() - 10);
      doc.save(`telapoka-report-${year}.pdf`);
    })();
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">{t("reports")}</h1>
        <div className="inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Previous year" onClick={() => setMonth(`${year - 1}-${month.slice(5)}`)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-14 text-center text-sm font-semibold money">{year}</span>
          <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Next year" onClick={() => setMonth(`${year + 1}-${month.slice(5)}`)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {reports.isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : !reports.data || reports.data.grandTotal === 0 ? (
        <div className="grid place-items-center gap-4 rounded-3xl border border-dashed py-16 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-2xl">📊</div>
          <p className="max-w-[240px] text-sm text-muted-foreground">{t("noDataYear", { year })}</p>
        </div>
      ) : (
        <>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">{t("totalPaid")} · {year}</p>
            <p className="text-3xl font-extrabold">
              <CountUp value={reports.data.grandTotal} prefix={currency} />
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-2xl gap-2 font-semibold">
                <a href="/api/export/csv" download>
                  <FileSpreadsheet className="size-4" />
                  {t("exportCsv")}
                </a>
              </Button>
              <Button className="rounded-2xl gap-2 font-semibold" onClick={exportPdf}>
                <FileDown className="size-4" />
                {t("exportPdf")}
              </Button>
            </div>
          </motion.section>

          <section className="rounded-3xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("monthlyCollection")}</h2>
            {(() => {
              const top = reports.data.perTracker.slice(0, 5);
              const chartData = reports.data.monthly.map((m) => ({
                label: m.label,
                ...Object.fromEntries(top.map((tr) => [tr.trackerId, m.byTracker[tr.trackerId] ?? 0])),
              }));
              return (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }}
                    formatter={(value: number | string) => [formatMoney(Number(value), currency), ""]}
                  />
                  {top.map((tr) => (
                    <Bar key={tr.trackerId} dataKey={tr.trackerId} stackId="a" fill={tr.color} radius={[4, 4, 0, 0]} name={tr.name} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
              );
            })()}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {reports.data.perTracker.slice(0, 5).map((tr) => (
                <span key={tr.trackerId} className="inline-flex items-center gap-1.5 text-xs font-medium">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: tr.color }} />
                  {tr.icon} {tr.name}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("byTracker")}</h2>
            {reports.data.perTracker.map((tr) => {
              const pct = reports.data!.grandTotal > 0 ? Math.round((tr.total / reports.data!.grandTotal) * 100) : 0;
              return (
                <div key={tr.trackerId} className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl text-lg" style={{ backgroundColor: `${tr.color}1a` }}>
                    {tr.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-bold">{tr.name}</p>
                      <span className="money shrink-0 text-sm font-extrabold">{formatMoney(tr.total, currency)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tr.monthsActive} {t("monthsActive")} · {pct}%
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: tr.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {reports.data.perPerson.length > 0 && (
            <section className="grid gap-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("byPerson")}</h2>
              {reports.data.perPerson.slice(0, 10).map((p, i) => (
                <div key={p.personId} className="flex items-center gap-3 rounded-2xl border bg-card px-3.5 py-2.5 shadow-sm">
                  <span className="money grid size-7 place-items-center rounded-full bg-secondary text-xs font-extrabold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.trackerName} · {p.monthsPaid} {t("monthsPaid").toLowerCase()}
                    </p>
                  </div>
                  <span className="money text-sm font-extrabold" style={{ color: p.trackerColor }}>
                    {formatMoney(p.total, currency)}
                  </span>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
