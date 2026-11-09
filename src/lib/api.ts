"use client";

import type { MonthState, ReportsDTO, SettingsDTO, PersonHistoryEntry, TrackerDTO, PersonDTO } from "./types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  monthState: (month: string) => req<MonthState>(`/api/state?month=${encodeURIComponent(month)}`),
  reports: (year: number) => req<ReportsDTO>(`/api/reports?year=${year}`),
  personHistory: (personId: string) => req<{ entries: PersonHistoryEntry[] }>(`/api/people/${personId}/history`),

  createTracker: (body: Partial<TrackerDTO>) => req<{ tracker: TrackerDTO }>("/api/trackers", { method: "POST", body: JSON.stringify(body) }),
  updateTracker: (id: string, body: Partial<TrackerDTO>) => req<{ tracker: TrackerDTO }>(`/api/trackers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTracker: (id: string) => req<{ ok: true }>(`/api/trackers/${id}`, { method: "DELETE" }),

  createPerson: (body: Partial<PersonDTO> & { trackerId: string }) => req<{ person: PersonDTO }>("/api/people", { method: "POST", body: JSON.stringify(body) }),
  updatePerson: (id: string, body: Partial<PersonDTO>) => req<{ person: PersonDTO }>(`/api/people/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePerson: (id: string) => req<{ ok: true }>(`/api/people/${id}`, { method: "DELETE" }),

  markPaid: (body: { personId: string; month: string; amount: number; method: string; paidAt: string; note?: string }) =>
    req<{ payment: unknown }>("/api/payments", { method: "POST", body: JSON.stringify(body) }),
  unmarkPaid: (paymentId: string) => req<{ ok: true }>(`/api/payments/${paymentId}`, { method: "DELETE" }),

  updateSettings: (body: Partial<SettingsDTO>) => req<{ settings: SettingsDTO }>("/api/settings", { method: "PUT", body: JSON.stringify(body) }),

  importBackup: (payload: unknown) => req<{ ok: true }>("/api/backup", { method: "POST", body: JSON.stringify(payload) }),
};
