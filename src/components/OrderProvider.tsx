"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { initDemoClock } from "@/lib/clock";
import { emptyTaste, findPatient, servedHistory, type OccasionId, type Patient, type Portion, type ServedMeal, type TasteProfile } from "@/lib/data";
import { dictionaries, languages, terminology, type Lang } from "@/lib/i18n";

export type Order = {
  /** Vald måltid och datum ("ÅÅÅÅ-MM-DD") den serveras. */
  occasion?: OccasionId;
  date?: string;
  dishId?: string;
  portion: Portion;
  extras: string[];
  drinkId?: string;
  placed: boolean;
};

/** Ett påbörjat val som sparas när patienten loggas ut innan hon har beställt. */
export type Draft = { order: Order; path: string };

type TextSize = "normal" | "stor";

type State = {
  patient: Patient | null;
  order: Order;
  textSize: TextSize;
  /** Ljudläge: sidor läses upp automatiskt och val bekräftas med ljud. */
  soundOn: boolean;
  lang: Lang;
  /** Serverade måltider per personnummer – sparas även när man loggar ut. */
  history: Record<string, ServedMeal[]>;
  /** Smakprofil per personnummer – sparas även när man loggar ut. */
  tastes: Record<string, TasteProfile>;
  /** Påbörjade val per personnummer, så att man kan fortsätta där man var. */
  drafts: Record<string, Draft>;
  /** Lagda beställningar per personnummer. */
  orders: Record<string, Order[]>;
};

type OrderContextValue = State & {
  hydrated: boolean;
  login: (patient: Patient) => void;
  logout: () => void;
  updateOrder: (patch: Partial<Order>) => void;
  toggleTextSize: () => void;
  setSoundOn: (on: boolean) => void;
  setLang: (lang: Lang) => void;
  /** Patientens serverade måltider, nyast först. */
  meals: ServedMeal[];
  addServedMeal: (meal: ServedMeal) => void;
  updateMeal: (id: string, patch: Partial<ServedMeal>) => void;
  /** Patientens smakprofil (tom om hon inte har fyllt i den). */
  taste: TasteProfile;
  hasTaste: boolean;
  setTaste: (taste: TasteProfile) => void;
  /** Påbörjat val från förra gången (finns tills hon fortsätter eller börjar om). */
  draft: Draft | undefined;
  resumeDraft: () => string | undefined;
  /** Ångra "Avbryt": logga in samma patient igen och fortsätt där hon var. */
  undoStop: (personnummer: string) => string | undefined;
  /** Börja en ny beställning för en måltid ett visst datum. */
  startOccasion: (occasion: OccasionId, date: string) => void;
  /** Skicka den aktuella beställningen (ersätter en tidigare för samma måltid och datum). */
  placeOrder: () => void;
  /** Öppna den senast lagda beställningen igen för att ändra den. */
  reopenOrder: () => void;
  /** Töm den aktuella beställningen inför nästa (den lagda finns kvar i placedOrders). */
  clearOrder: () => void;
  /** Patientens lagda beställningar. */
  placedOrders: Order[];
  discardDraft: () => void;
};

const emptyOrder: Order = { portion: "lagom", extras: [], placed: false };
const initialState: State = {
  patient: null,
  order: emptyOrder,
  textSize: "normal",
  soundOn: false,
  lang: "sv",
  history: {},
  tastes: {},
  drafts: {},
  orders: {},
};
const STORAGE_KEY = "ingrid-order";
/** Plattan loggar ut efter en stunds inaktivitet så att ingen annan ser patientens uppgifter. */
export const IDLE_LOGOUT_MS = 10 * 60 * 1000;

const OrderContext = createContext<OrderContextValue | null>(null);

/** Saker som följer med patienten (eller plattan) mellan inloggningar. */
function keep(s: State): Partial<State> {
  return {
    textSize: s.textSize,
    soundOn: s.soundOn,
    lang: s.lang,
    history: s.history,
    tastes: s.tastes,
    drafts: s.drafts,
    orders: s.orders,
  };
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Sparas i sessionStorage så att en omladdning av sidan inte tappar beställningen.
  useEffect(() => {
    initDemoClock();
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
    const html = document.documentElement;
    html.dataset.textSize = state.textSize;
    html.lang = state.lang;
    html.dir = languages.find((l) => l.id === state.lang)?.dir ?? "ltr";
  }, [state, hydrated]);

  /** Loggar ut och sparar ett påbörjat val, så att hon kan fortsätta där hon var. */
  const logoutKeepingDraft = (s: State, path: string): State => {
    const drafts = { ...s.drafts };
    if (s.patient) {
      const pnr = s.patient.personnummer;
      if (!s.order.placed && s.order.dishId) drafts[pnr] = { order: s.order, path };
      else delete drafts[pnr];
    }
    return { ...initialState, ...keep(s), drafts };
  };

  // Automatisk utloggning vid inaktivitet. Testas med window.dispatchEvent(new Event("ingrid-idle")).
  useEffect(() => {
    if (!state.patient) return;
    let timer = setTimeout(expire, IDLE_LOGOUT_MS);
    function expire() {
      setState((s) => logoutKeepingDraft(s, window.location.pathname + window.location.search));
      router.replace("/");
    }
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(expire, IDLE_LOGOUT_MS);
    };
    const events = ["pointerdown", "keydown"];
    events.forEach((e) => window.addEventListener(e, reset));
    window.addEventListener("ingrid-idle", expire);
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      window.removeEventListener("ingrid-idle", expire);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.patient, router]);

  const pnr = state.patient?.personnummer;

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
    logout: () => setState((s) => logoutKeepingDraft(s, pathname)),
    updateOrder: (patch) => setState((s) => ({ ...s, order: { ...s.order, ...patch } })),
    toggleTextSize: () =>
      setState((s) => ({ ...s, textSize: s.textSize === "normal" ? "stor" : "normal" })),
    setSoundOn: (soundOn) => setState((s) => ({ ...s, soundOn })),
    setLang: (lang) => setState((s) => ({ ...s, lang })),
    meals: pnr ? state.history[pnr] ?? [] : [],
    addServedMeal: (meal) =>
      setState((s) => {
        if (!s.patient) return s;
        const id = s.patient.personnummer;
        return { ...s, history: { ...s.history, [id]: [meal, ...(s.history[id] ?? [])] } };
      }),
    updateMeal: (mealId, patch) =>
      setState((s) => {
        if (!s.patient) return s;
        const id = s.patient.personnummer;
        const meals = (s.history[id] ?? []).map((m) => (m.id === mealId ? { ...m, ...patch } : m));
        return { ...s, history: { ...s.history, [id]: meals } };
      }),
    // Äldre sparade profiler saknar t.ex. cuisines – fyll på med tomma listor.
    taste: { ...emptyTaste, ...(pnr ? state.tastes[pnr] : undefined) },
    hasTaste: !!pnr && !!state.tastes[pnr],
    setTaste: (taste) =>
      setState((s) => (s.patient ? { ...s, tastes: { ...s.tastes, [s.patient.personnummer]: taste } } : s)),
    draft: pnr ? state.drafts[pnr] : undefined,
    resumeDraft: () => {
      const draft = pnr ? state.drafts[pnr] : undefined;
      if (!draft || !pnr) return undefined;
      setState((s) => {
        const drafts = { ...s.drafts };
        delete drafts[pnr];
        return { ...s, order: draft.order, drafts };
      });
      return draft.path;
    },
    undoStop: (personnummer) => {
      const patient = findPatient(personnummer);
      if (!patient) return undefined;
      const draft = state.drafts[personnummer];
      setState((s) => {
        const drafts = { ...s.drafts };
        delete drafts[personnummer];
        return { ...s, patient, order: draft?.order ?? emptyOrder, drafts };
      });
      return draft?.path ?? "/valkommen";
    },
    startOccasion: (occasion, date) => setState((s) => ({ ...s, order: { ...emptyOrder, occasion, date } })),
    placeOrder: () =>
      setState((s) => {
        if (!s.patient) return s;
        const id = s.patient.personnummer;
        const placed = { ...s.order, placed: true };
        const others = (s.orders[id] ?? []).filter((o) => !(o.occasion === placed.occasion && o.date === placed.date));
        return { ...s, order: placed, orders: { ...s.orders, [id]: [...others, placed] } };
      }),
    reopenOrder: () =>
      setState((s) => {
        if (!s.patient) return s;
        const id = s.patient.personnummer;
        const others = (s.orders[id] ?? []).filter((o) => !(o.occasion === s.order.occasion && o.date === s.order.date));
        return { ...s, order: { ...s.order, placed: false }, orders: { ...s.orders, [id]: others } };
      }),
    placedOrders: pnr ? state.orders[pnr] ?? [] : [],
    clearOrder: () => setState((s) => ({ ...s, order: emptyOrder })),
    discardDraft: () =>
      setState((s) => {
        if (!s.patient) return s;
        const drafts = { ...s.drafts };
        delete drafts[s.patient.personnummer];
        return { ...s, drafts };
      }),
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder måste användas inom <OrderProvider>");
  return ctx;
}

/** Texter och visningsnamn på patientens valda språk. */
export function useT() {
  const { lang } = useOrder();
  return {
    t: dictionaries[lang],
    tm: terminology(lang),
    lang,
    speechLang: languages.find((l) => l.id === lang)?.speech ?? "sv-SE",
  };
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
