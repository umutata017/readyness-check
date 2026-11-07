import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { jobs as seedJobs, technicians, type Job } from "@/data/jobs";
import {
  createJob as storeCreateJob,
  editJob as storeEditJob,
  latestOpenEntry,
  markJobUpdatesSeen,
  openEntries,
  reassignJob as storeReassignJob,
  type JobChanges,
  type NewJobInput,
  type UpdateEntry,
} from "@/data/store";

const STORAGE_KEY = "advantiq-demo-state";
const DEFAULT_TECHNICIAN_ID = "tech-a";

type DemoState = { technicianId: string; jobs: Job[] };

type TechnicianContextValue = {
  technicianId: string;
  setTechnicianId: (id: string) => void;
  jobs: Job[];
  getJob: (id: string) => Job | undefined;
  isUpdateSeen: (job: Job) => boolean;
  openUpdate: (job: Job) => UpdateEntry | undefined;
  markUpdateSeen: (jobId: string) => void;
  createJob: (input: NewJobInput) => Job;
  editJob: (id: string, changes: JobChanges, opts: { message?: string; notify: boolean }) => void;
  reassignJob: (id: string, technicianId: string, opts: { message?: string; notify: boolean }) => void;
  resetDemo: () => void;
};

const TechnicianContext = createContext<TechnicianContextValue | null>(null);

function readStoredState(): DemoState {
  const fallback: DemoState = { technicianId: DEFAULT_TECHNICIAN_ID, jobs: seedJobs };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      technicianId: technicians.some((t) => t.id === parsed.technicianId) ? parsed.technicianId! : fallback.technicianId,
      jobs: Array.isArray(parsed.jobs) && parsed.jobs.length > 0 ? (parsed.jobs as Job[]) : fallback.jobs,
    };
  } catch {
    return fallback;
  }
}

export function TechnicianProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start from the default, then hydrate from localStorage after mount.
  const [state, setState] = useState<DemoState>({ technicianId: DEFAULT_TECHNICIAN_ID, jobs: seedJobs });

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
    jobs: state.jobs,
    getJob: (id) => state.jobs.find((j) => j.id === id),
    isUpdateSeen: (job) => openEntries(job).length === 0,
    openUpdate: (job) => latestOpenEntry(job),
    markUpdateSeen: (jobId) => setState((s) => ({ ...s, jobs: markJobUpdatesSeen(s.jobs, jobId) })),
    createJob: (input) => {
      let created: Job | undefined;
      setState((s) => {
        const next = storeCreateJob(s.jobs, input);
        created = next.at(-1);
        return { ...s, jobs: next };
      });
      return created!;
    },
    editJob: (id, changes, opts) => setState((s) => ({ ...s, jobs: storeEditJob(s.jobs, id, changes, opts) })),
    reassignJob: (id, technicianId, opts) => setState((s) => ({ ...s, jobs: storeReassignJob(s.jobs, id, technicianId, opts) })),
    resetDemo: () => setState((s) => ({ ...s, jobs: seedJobs })),
  };

  return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
}

export function useTechnician(): TechnicianContextValue {
  const ctx = useContext(TechnicianContext);
  if (!ctx) throw new Error("useTechnician must be used inside TechnicianProvider");
  return ctx;
}
