"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { waLink, smsLink, formatMoney } from "@/lib/format";
import { useT, monthLabel, useLangStore } from "@/lib/i18n";
import { MessageCircle, Copy, PhoneOff } from "lucide-react";

export function nudgeMessage(
  lang: "en" | "bn",
  name: string,
  trackerName: string,
  month: string,
  amount: string
): string {
  if (lang === "bn") {
    return `হ্যালো ${name}, ${trackerName}-এর ${monthLabel(month, "bn", true)} মাসের চাঁদা ${amount} এখনো বাকি আছে। অনুগ্রহ করে পরিশোধ করুন। ধন্যবাদ! — TELAPOKA`;
  }
  return `Hi ${name}, your ${trackerName} share for ${monthLabel(month, "en", true)} (${amount}) is still pending. Please pay at your earliest. Thank you! — TELAPOKA`;
}

export function NudgeButtons({
  name,
  phone,
  trackerName,
  month,
  amountStr,
  compact = false,
}: {
  name: string;
  phone?: string | null;
  trackerName: string;
  month: string;
  amountStr: string;
  compact?: boolean;
}) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const msg = nudgeMessage(lang, name, trackerName, month, amountStr);

  if (!phone) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        className={compact ? "h-8 rounded-full gap-1 text-xs" : "rounded-xl gap-2"}
        onClick={() => {
          navigator.clipboard?.writeText(msg).then(
            () => toast.success(t("copied")),
            () => toast.error(t("noPhone"))
          );
        }}
        aria-label={t("copyMsg")}
      >
        <PhoneOff className="size-3.5" />
        {t("copyMsg")}
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <a href={waLink(phone, msg)} target="_blank" rel="noopener noreferrer" aria-label={t("whatsapp")}>
        <Button
          size={compact ? "sm" : "default"}
          className={compact ? "h-8 rounded-full gap-1 text-xs font-semibold" : "rounded-xl gap-1.5 font-semibold"}
          style={{ backgroundColor: "#1EBE5D", color: "#fff" }}
        >
          <MessageCircle className="size-3.5" />
          {t("whatsapp")}
        </Button>
      </a>
      <a href={smsLink(phone, msg)} aria-label={t("sms")}>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={compact ? "h-8 rounded-full gap-1 text-xs" : "rounded-xl gap-1.5"}
        >
          {t("sms")}
        </Button>
      </a>
      <Button
        variant="ghost"
        size="icon"
        className={compact ? "size-8 rounded-full" : "size-9 rounded-full"}
        aria-label={t("copyMsg")}
        onClick={() => {
          navigator.clipboard?.writeText(msg).then(
            () => toast.success(t("copied")),
            () => toast.error("Clipboard unavailable")
          );
        }}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}
