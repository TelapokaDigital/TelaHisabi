"use client";

import { create } from "zustand";

export type Lang = "en" | "bn";

const dict = {
  // nav / shell
  appName: { en: "TELAPOKA", bn: "টেলাপোকা" },
  tagline: { en: "Shared payment tracker", bn: "শেয়ারড পেমেন্ট ট্র্যাকার" },
  home: { en: "Home", bn: "হোম" },
  reports: { en: "Reports", bn: "রিপোর্ট" },
  settings: { en: "Settings", bn: "সেটিংস" },

  // month / time
  daysLeft: { en: "days left", bn: "দিন বাকি" },
  day: { en: "day", bn: "দিন" },
  days: { en: "days", bn: "দিন" },
  dueToday: { en: "due today", bn: "আজ শেষ তারিখ" },

  // dashboard
  collected: { en: "Collected", bn: "আদায়" },
  expected: { en: "Expected", bn: "প্রত্যাশিত" },
  collectedOfExpected: { en: "collected", bn: "আদায় হয়েছে" },
  ofCollected: { en: "of", bn: "এর মধ্যে" },
  pending: { en: "Pending", bn: "বাকি" },
  pendingPeople: { en: "people pending", bn: "জন বাকি" },
  overdue: { en: "overdue", bn: "সময় পেরিয়েছে" },
  daysOverdue: { en: "days overdue", bn: "দিন দেরি" },
  dueInDays: { en: "due in {n} days", bn: "{n} দিন পরে দেনা শেষ" },
  allPaid: { en: "Everyone paid — nice work!", bn: "সবাই পরিশোধ করেছে — দারুণ!" },
  needsAttention: { en: "Needs attention", bn: "মনোযোগ দরকার" },
  nudge: { en: "Nudge", bn: "রিমাইন্ডার" },
  sendNudge: { en: "Send nudge", bn: "রিমাইন্ডার পাঠান" },
  trackers: { en: "Trackers", bn: "ট্র্যাকার" },
  addTracker: { en: "Add tracker", bn: "ট্র্যাকার যোগ করুন" },
  noTrackersTitle: { en: "Start your first tracker", bn: "প্রথম ট্র্যাকার শুরু করুন" },
  noTrackersBody: {
    en: "Track WiFi, rent, generator fuel — anything you collect monthly from others.",
    bn: "ওয়াইফাই, বাসা ভাড়া, জেনারেটরের তেল — যা কিছু মাসিক আদায় করেন তা ট্র্যাক করুন।",
  },

  // tracker view
  people: { en: "People", bn: "সদস্য" },
  addPerson: { en: "Add person", bn: "সদস্য যোগ করুন" },
  markPaid: { en: "Mark paid", bn: "পরিশোধ করুন" },
  paid: { en: "Paid", bn: "পরিশোধিত" },
  unpaid: { en: "Unpaid", bn: "বাকি" },
  undoPaid: { en: "Undo", bn: "আনডু" },
  perMonth: { en: "/mo", bn: "/মাস" },
  editTracker: { en: "Edit tracker", bn: "ট্র্যাকার সম্পাদনা" },
  deleteTracker: { en: "Delete tracker", bn: "ট্র্যাকার মুছুন" },
  deleteTrackerConfirm: {
    en: "Delete \"{name}\" and all its people & payment history? This cannot be undone.",
    bn: "\"{name}\" এবং তার সব সদস্য ও লেনদেন মুছে ফেলবেন? এটি ফেরানো যাবে না।",
  },
  noPeopleTitle: { en: "No people yet", bn: "এখনো কোনো সদস্য নেই" },
  noPeopleBody: { en: "Add neighbors or flatmates you collect from.", bn: "যাদের কাছ থেকে আদায় করেন তাদের যোগ করুন।" },
  reminderOnDay: { en: "Remind on day {n} of month", bn: "মাসের {n} তারিখে রিমাইন্ডার" },

  // person view
  history: { en: "History", bn: "ইতিহাস" },
  totalPaid: { en: "Total paid", bn: "মোট পরিশোধ" },
  monthsPaid: { en: "Months paid", bn: "পরিশোধিত মাস" },
  editPerson: { en: "Edit person", bn: "সদস্য সম্পাদনা" },
  deletePerson: { en: "Delete person", bn: "সদস্য মুছুন" },
  deletePersonConfirm: {
    en: "Remove {name} and their payment history from this tracker?",
    bn: "{name} এবং তার সব লেনদেন এই ট্র্যাকার থেকে মুছে ফেলবেন?",
  },
  phone: { en: "Phone", bn: "ফোন" },
  dueAmount: { en: "Due amount", bn: "মাসিক বকেয়া" },
  noPhone: { en: "No phone number", bn: "ফোন নম্বর নেই" },
  lastPaid: { en: "Last paid", bn: "শেষ পরিশোধ" },
  thisMonth: { en: "This month", bn: "এই মাস" },
  neverPaid: { en: "Never paid yet", bn: "এখনো পরিশোধ করেননি" },

  // mark paid sheet
  recordPayment: { en: "Record payment", bn: "লেনদেন সংরক্ষণ" },
  amount: { en: "Amount", bn: "পরিমাণ" },
  method: { en: "Method", bn: "মাধ্যম" },
  date: { en: "Date", bn: "তারিখ" },
  note: { en: "Note (optional)", bn: "নোট (ঐচ্ছিক)" },
  savePayment: { en: "Save", bn: "সংরক্ষণ" },
  markedPaid: { en: "Marked {name} paid", bn: "{name} পরিশোধ হয়েছে" },
  paymentRemoved: { en: "Payment removed", bn: "লেনদেন মুছে ফেলা হয়েছে" },
  cash: { en: "Cash", bn: "নগদ টাকা" },
  bkash: { en: "bKash", bn: "বিকাশ" },
  nagad: { en: "Nagad", bn: "নগদ" },
  bank: { en: "Bank", bn: "ব্যাংক" },
  other: { en: "Other", bn: "অন্যান্য" },

  // forms
  trackerName: { en: "Tracker name", bn: "ট্র্যাকারের নাম" },
  trackerNamePh: { en: "e.g. WiFi, Flat Rent", bn: "যেমন: ওয়াইফাই, ফ্ল্যাট ভাড়া" },
  defaultDue: { en: "Default monthly due", bn: "ডিফল্ট মাসিক বকেয়া" },
  reminderDay: { en: "Reminder day", bn: "রিমাইন্ডারের দিন" },
  icon: { en: "Icon", bn: "আইকন" },
  color: { en: "Color", bn: "রঙ" },
  personName: { en: "Name", bn: "নাম" },
  personNamePh: { en: "e.g. Rahim (Flat 4B)", bn: "যেমন: রহিম (ফ্ল্যাট 4B)" },
  phonePh: { en: "01XXXXXXXXX", bn: "০১XXXXXXXXX" },
  photo: { en: "Photo (optional)", bn: "ছবি (ঐচ্ছিক)" },
  save: { en: "Save", bn: "সংরক্ষণ" },
  cancel: { en: "Cancel", bn: "বাতিল" },
  update: { en: "Update", bn: "আপডেট" },
  delete: { en: "Delete", bn: "মুছুন" },
  required: { en: "Required", bn: "আবশ্যক" },
  nameExists: { en: "This name already exists in this tracker", bn: "এই নামটি ইতিমধ্যে এই ট্র্যাকারে আছে" },
  trackerExists: { en: "A tracker with this name already exists", bn: "এই নামের ট্র্যাকার আগেই আছে" },
  amountMustBePositive: { en: "Amount must be greater than 0", bn: "পরিমাণ ০ এর বেশি হতে হবে" },
  invalidPhone: { en: "Phone looks invalid", bn: "ফোন নম্বরটি সঠিক নয়" },
  addedTracker: { en: "Tracker created", bn: "ট্র্যাকার তৈরি হয়েছে" },
  addedPerson: { en: "Person added", bn: "সদস্য যোগ হয়েছে" },
  updated: { en: "Updated", bn: "আপডেট হয়েছে" },
  deleted: { en: "Deleted", bn: "মুছে ফেলা হয়েছে" },

  // reports
  yearlyReport: { en: "Yearly report", bn: "বার্ষিক রিপোর্ট" },
  monthlyCollection: { en: "Monthly collection", bn: "মাসিক আদায়" },
  byTracker: { en: "By tracker", bn: "ট্র্যাকার অনুযায়ী" },
  byPerson: { en: "Top people", bn: "শীর্ষ সদস্য" },
  exportCsv: { en: "Export CSV", bn: "CSV এক্সপোর্ট" },
  exportPdf: { en: "Export PDF", bn: "PDF এক্সপোর্ট" },
  noDataYear: { en: "No payments recorded in {year} yet.", bn: "{year} সালে এখনো কোনো লেনদেন নেই।" },
  monthsActive: { en: "active months", bn: "সক্রিয় মাস" },

  // settings
  language: { en: "Language", bn: "ভাষা" },
  theme: { en: "Theme", bn: "থিম" },
  system: { en: "System", bn: "সিস্টেম" },
  light: { en: "Light", bn: "লাইট" },
  dark: { en: "Dark", bn: "ডার্ক" },
  currency: { en: "Currency", bn: "মুদ্রা" },
  defaultReminderDay: { en: "Default reminder day", bn: "ডিফল্ট রিমাইন্ডার দিন" },
  backupExport: { en: "Backup data", bn: "ব্যাকআপ" },
  backupExportDesc: { en: "Download a JSON copy of everything", bn: "সব ডেটার JSON কপি ডাউনলোড" },
  importData: { en: "Restore backup", bn: "ব্যাকআপ রিস্টোর" },
  importDataDesc: { en: "Replace current data with a backup file", bn: "ব্যাকআপ ফাইল দিয়ে বর্তমান ডেটা বদলান" },
  importConfirm: {
    en: "Restore will REPLACE all current data with the backup. Continue?",
    bn: "রিস্টোর করলে সব বর্তমান ডেটা বদলে যাবে। চালিয়ে যাবেন?",
  },
  importSuccess: { en: "Backup restored", bn: "ব্যাকআপ রিস্টোর হয়েছে" },
  importFailed: { en: "Invalid backup file", bn: "ব্যাকআপ ফাইল সঠিক নয়" },
  reminders: { en: "Reminders", bn: "রিমাইন্ডার" },
  enableReminders: { en: "Enable reminders", bn: "রিমাইন্ডার চালু করুন" },
  remindersOn: { en: "Reminders enabled", bn: "রিমাইন্ডার চালু আছে" },
  remindersNote: {
    en: "You'll get a browser alert when this app is open and someone passes the reminder day.",
    bn: "রিমাইন্ডার দিন পেরোলে অ্যাপ খোলা থাকলে ব্রাউজার সতর্কতা পাবেন।",
  },
  install: { en: "Install app", bn: "অ্যাপ ইনস্টল" },
  installNote: {
    en: "Use your browser menu → \"Add to Home Screen\" to install TELAPOKA as an app.",
    bn: "ব্রাউজার মেনু → \"Add to Home Screen\" দিয়ে TELAPOKA অ্যাপ হিসেবে ইনস্টল করুন।",
  },
  about: { en: "About", bn: "সম্পর্কে" },
  madeFor: { en: "Private collection tracking — no accounts, no shared access.", bn: "ব্যক্তিগত আদায় ট্র্যাকিং — কোনো অ্যাকাউন্ট নেই, কোনো শেয়ারড অ্যাক্সেস নেই।" },

  // nudge
  nudgeMsg: {
    en: "Hi {name}, your {tracker} share for {month} ({amount}) is still pending. Please pay at your earliest. Thank you!",
    bn: "হ্যালো {name}, {tracker}-এর {month} মাসের চাঁদা {amount} এখনো বাকি আছে। অনুগ্রহ করে পরিশোধ করুন। ধন্যবাদ!",
  },
  whatsapp: { en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
  sms: { en: "SMS", bn: "এসএমএস" },
  copyMsg: { en: "Copy message", bn: "মেসেজ কপি" },
  copied: { en: "Copied", bn: "কপি হয়েছে" },

  // misc
  offline: { en: "You're offline — reconnecting…", bn: "আপনি অফলাইনে — পুনঃসংযোগ হচ্ছে…" },
  loading: { en: "Loading…", bn: "লোড হচ্ছে…" },
  months: {
    en: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec",
    bn: "জানু_ফেব_মার_এপ্র_মে_জুন_জুল_আগ_সেপ_অক্টো_নভে_ডিস",
  },
  monthsFull: {
    en: "January_February_March_April_May_June_July_August_September_October_November_December",
    bn: "জানুয়ারি_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর",
  },
} as const;

export type DictKey = keyof typeof dict;

export function makeT(lang: Lang): (key: DictKey, vars?: Record<string, string | number>) => string {
  return (key, vars) => {
    const entry = dict[key] as Record<Lang, string>;
    let s: string = entry[lang] ?? entry.en;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}

interface LangStore {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const saved = typeof window !== "undefined" ? (localStorage.getItem("telapoka.lang") as Lang | null) : null;

export const useLangStore = create<LangStore>((set) => ({
  lang: saved === "bn" ? "bn" : "en",
  setLang: (l) => {
    localStorage.setItem("telapoka.lang", l);
    set({ lang: l });
  },
}));

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return makeT(lang);
}

export function monthLabel(month: string, lang: Lang, full = false) {
  const [y, m] = month.split("-").map(Number);
  const names = (full ? dict.monthsFull : dict.months)[lang === "bn" ? "bn" : "en"].split("_");
  return `${names[m - 1]} ${y}`;
}
