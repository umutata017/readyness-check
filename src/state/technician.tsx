import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { technicians, type Job } from "@/data/jobs";

const STORAGE_KEY = "advantiq-demo-state";

type DemoState = { technicianId: string; seenUpdates: Record<string, boolean> };

type TechnicianContextValue = {
  technicianId: string;
  setTechnicianId: (id: string) => void;
  isUpdateSeen: (job: Job) => boolean;
  markUpdateSeen: (jobId: string) => void;
};

const TechnicianContext = createContext<TechnicianContextValue | null>(null);

function readStoredState(): DemoState {
  const fallback: DemoState = { technicianId: technicians[0].id, seenUpdates: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      technicianId: technicians.some((t) => t.id === parsed.technicianId) ? parsed.technicianId! : fallback.technicianId,
      seenUpdates: parsed.seenUpdates && typeof parsed.seenUpdates === "object" ? parsed.seenUpdates : {},
    };
  } catch {
    return fallback;
  }
}

export function TechnicianProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start from the default, then hydrate from localStorage after mount.
  const [state, setState] = useState<DemoState>({ technicianId: technicians[0].id, seenUpdates: {} });

  useEffect(() => {
    setState(readStoredState());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private browsing etc. — demo still works for the session.
    }
  }, [state]);

  const value: TechnicianContextValue = {
    technicianId: state.technicianId,
    setTechnicianId: (id) => setState((s) => ({ ...s, technicianId: id })),
    isUpdateSeen: (job) => !job.update || Boolean(state.seenUpdates[job.id]),
    markUpdateSeen: (jobId) => setState((s) => ({ ...s, seenUpdates: { ...s.seenUpdates, [jobId]: true } })),
  };

  return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
}

export function useTechnician(): TechnicianContextValue {
  const ctx = useContext(TechnicianContext);
  if (!ctx) throw new Error("useTechnician must be used inside TechnicianProvider");
  return ctx;
}
