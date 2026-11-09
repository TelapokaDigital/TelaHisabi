export function currentMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthDay(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function daysLeftInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  const now = new Date();
  if (y !== now.getFullYear() || m !== now.getMonth() + 1) return 0;
  return new Date(y, m, 0).getDate() - now.getDate();
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatMoney(amount: number, currency: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const str = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
  return `${currency}${str.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** days past the tracker reminderDay for an unpaid person in `month` (current month only) */
export function overdueInfo(reminderDay: number, month: string): { overdue: boolean; days: number; dueIn: number } {
  const [y, m] = month.split("-").map(Number);
  const now = new Date();
  const isCurrent = y === now.getFullYear() && m === now.getMonth() + 1;
  if (!isCurrent) {
    // previous months are always overdue if unpaid
    return { overdue: true, days: 999, dueIn: 0 };
  }
  const today = now.getDate();
  if (today > reminderDay) return { overdue: true, days: today - reminderDay, dueIn: 0 };
  if (today === reminderDay) return { overdue: false, days: 0, dueIn: 0 };
  return { overdue: false, days: 0, dueIn: reminderDay - today };
}

/** normalize a Bangladeshi-ish phone to international digits for wa.me / sms links */
export function toIntlPhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("880")) return p;
  if (p.startsWith("0") && p.length >= 10) return "880" + p.slice(1);
  return p;
}

export function waLink(phone: string, message: string): string {
  const p = toIntlPhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}

export function smsLink(phone: string, message: string): string {
  const p = toIntlPhone(phone);
  return `sms:${p}?body=${encodeURIComponent(message)}`;
}

export function monthShortName(month: string, names: string[]): string {
  const m = Number(month.split("-")[1]);
  return names[m - 1] ?? month;
}
