export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "BANK" | "OTHER";

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BKASH", "NAGAD", "BANK", "OTHER"];

export interface TrackerDTO {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultDue: number;
  reminderDay: number;
  createdAt: string;
  people: PersonDTO[];
}

export interface PersonDTO {
  id: string;
  trackerId: string;
  name: string;
  phone: string | null;
  photo: string | null;
  dueAmount: number;
  createdAt: string;
}

export interface PaymentDTO {
  id: string;
  personId: string;
  trackerId: string;
  month: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  note: string | null;
}

/** Enriched person for a given month */
export interface PersonWithStatus extends PersonDTO {
  payment: PaymentDTO | null;
  lastPaidMonth: string | null;
  lastPaidAt: string | null;
}

export interface TrackerWithPeople extends TrackerDTO {
  people: PersonWithStatus[];
}

export interface SettingsDTO {
  currency: string;
  currencyCode: string;
  reminderDay: number;
}

export interface MonthState {
  month: string;
  trackers: TrackerWithPeople[];
  settings: SettingsDTO;
}

export interface PersonHistoryEntry {
  month: string;
  payment: PaymentDTO | null;
}

export interface ReportsDTO {
  year: number;
  monthly: { month: string; label: string; total: number; byTracker: Record<string, number> }[];
  perTracker: { trackerId: string; name: string; icon: string; color: string; total: number; monthsActive: number }[];
  perPerson: {
    personId: string;
    name: string;
    trackerName: string;
    trackerColor: string;
    monthsPaid: number;
    total: number;
  }[];
  grandTotal: number;
}
