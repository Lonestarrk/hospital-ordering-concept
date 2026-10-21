"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { emptyTaste, servedHistory, type Patient, type Portion, type ServedMeal, type TasteProfile } from "@/lib/data";

export type Order = {
  dishId?: string;
  portion: Portion;
  extras: string[];
  drinkId?: string;
  placed: boolean;
};

type TextSize = "normal" | "stor";

type State = {
  patient: Patient | null;
  order: Order;
  textSize: TextSize;
  /** Ljudläge: sidor läses upp automatiskt och val bekräftas med ljud. */
  soundOn: boolean;
  /** Serverade måltider per personnummer – sparas även när man loggar ut. */
  history: Record<string, ServedMeal[]>;
  /** Smakprofil per personnummer – sparas även när man loggar ut. */
  tastes: Record<string, TasteProfile>;
};

type OrderContextValue = State & {
  hydrated: boolean;
  login: (patient: Patient) => void;
  logout: () => void;
  updateOrder: (patch: Partial<Order>) => void;
  toggleTextSize: () => void;
  setSoundOn: (on: boolean) => void;
  /** Patientens serverade måltider, nyast först. */
  meals: ServedMeal[];
  addServedMeal: (meal: ServedMeal) => void;
  updateMeal: (id: string, patch: Partial<ServedMeal>) => void;
  /** Patientens smakprofil (tom om hon inte har fyllt i den). */
  taste: TasteProfile;
  hasTaste: boolean;
  setTaste: (taste: TasteProfile) => void;
};

const emptyOrder: Order = { portion: "lagom", extras: [], placed: false };
const initialState: State = { patient: null, order: emptyOrder, textSize: "normal", soundOn: false, history: {}, tastes: {} };
const STORAGE_KEY = "ingrid-order";

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);

  // Sparas i sessionStorage så att en omladdning av sidan inte tappar beställningen.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...initialState, ...JSON.parse(saved) });
    } catch {
      // Ingen lagring tillgänglig – börja om från början.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignorera – prototypen fungerar ändå.
    }
    document.documentElement.dataset.textSize = state.textSize;
  }, [state, hydrated]);

  const value: OrderContextValue = {
    ...state,
    hydrated,
    login: (patient) =>
      setState((s) => ({
        ...s,
        patient,
        order: emptyOrder,
        history: s.history[patient.personnummer]
          ? s.history
          : { ...s.history, [patient.personnummer]: servedHistory[patient.personnummer] ?? [] },
      })),
    logout: () =>
      setState((s) => ({ ...initialState, textSize: s.textSize, soundOn: s.soundOn, history: s.history, tastes: s.tastes })),
    updateOrder: (patch) => setState((s) => ({ ...s, order: { ...s.order, ...patch } })),
    toggleTextSize: () =>
      setState((s) => ({ ...s, textSize: s.textSize === "normal" ? "stor" : "normal" })),
    setSoundOn: (soundOn) => setState((s) => ({ ...s, soundOn })),
    meals: state.patient ? state.history[state.patient.personnummer] ?? [] : [],
    addServedMeal: (meal) =>
      setState((s) => {
        if (!s.patient) return s;
        const pnr = s.patient.personnummer;
        return { ...s, history: { ...s.history, [pnr]: [meal, ...(s.history[pnr] ?? [])] } };
      }),
    taste: (state.patient && state.tastes[state.patient.personnummer]) || emptyTaste,
    hasTaste: !!state.patient && !!state.tastes[state.patient.personnummer],
    setTaste: (taste) =>
      setState((s) => (s.patient ? { ...s, tastes: { ...s.tastes, [s.patient.personnummer]: taste } } : s)),
    updateMeal: (id, patch) =>
      setState((s) => {
        if (!s.patient) return s;
        const pnr = s.patient.personnummer;
        const meals = (s.history[pnr] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m));
        return { ...s, history: { ...s.history, [pnr]: meals } };
      }),
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder måste användas inom <OrderProvider>");
  return ctx;
}

/** Skickar tillbaka till inloggningen om ingen patient är inloggad. */
export function useRequirePatient(): OrderContextValue & { patient: Patient | null } {
  const ctx = useOrder();
  const router = useRouter();
  useEffect(() => {
    if (ctx.hydrated && !ctx.patient) router.replace("/");
  }, [ctx.hydrated, ctx.patient, router]);
  return ctx;
}
