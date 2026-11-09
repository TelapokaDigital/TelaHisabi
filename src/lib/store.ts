"use client";

import { create } from "zustand";
import { currentMonth } from "./format";

export type Tab = "home" | "reports" | "settings";

export interface Overlay {
  type: "tracker" | "person";
  id: string;
}

interface AppState {
  tab: Tab;
  setTab: (t: Tab) => void;
  month: string;
  setMonth: (m: string) => void;
  overlays: Overlay[];
  openTracker: (id: string) => void;
  openPerson: (id: string) => void;
  popOverlay: () => void;
  closeAllOverlays: () => void;
  trackerDialog: { open: boolean; trackerId: string | null };
  openTrackerDialog: (trackerId?: string | null) => void;
  closeTrackerDialog: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  tab: "home",
  setTab: (t) => set({ overlays: [], tab: t }),
  month: currentMonth(),
  setMonth: (m) => set({ month: m }),
  overlays: [],
  openTracker: (id) => set((s) => ({ overlays: [{ type: "tracker", id }] })),
  openPerson: (id) => set((s) => ({ overlays: [...s.overlays, { type: "person", id }] })),
  popOverlay: () => set((s) => ({ overlays: s.overlays.slice(0, -1) })),
  closeAllOverlays: () => set({ overlays: [] }),
  trackerDialog: { open: false, trackerId: null },
  openTrackerDialog: (trackerId = null) => set({ trackerDialog: { open: true, trackerId } }),
  closeTrackerDialog: () => set({ trackerDialog: { open: false, trackerId: null } }),
}));
