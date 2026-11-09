import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { technicians, type Job, type UpdateEntry } from "@/data/jobs";
import {
  createJob as storeCreateJob,
  editJob as storeEditJob,
  getJobs,
  latestOpenEntry,
  markJobUpdatesSeen,
  openEntries,
  reassignJob as storeReassignJob,
  resetDemoData as storeResetDemoData,
  type JobChanges,
  type NewJobInput,
} from "@/data/store";

const DEFAULT_TECHNICIAN_ID = "tech-a";

type TechnicianContextValue = {
  hydrated: boolean;
  backendError: string | null;
  retry: () => void;
  technicianId: string;
  setTechnicianId: (id: string) => void;
  jobs: Job[];
  getJob: (id: string) => Job | undefined;
  isUpdateSeen: (job: Job) => boolean;
  openUpdate: (job: Job) => UpdateEntry | undefined;
  markUpdateSeen: (jobId: string) => Promise<void>;
  createJob: (input: NewJobInput) => Promise<Job>;
  editJob: (
    id: string,
    changes: JobChanges,
    opts: { message?: string; notify: boolean },
  ) => Promise<void>;
  reassignJob: (
    id: string,
    technicianId: string,
    opts: { message?: string; notify: boolean },
  ) => Promise<void>;
  resetDemo: () => Promise<void>;
};

const TechnicianContext = createContext<TechnicianContextValue | null>(null);

export function TechnicianProvider({ children }: { children: ReactNode }) {
  const [technicianId, setTechnicianId] = useState(DEFAULT_TECHNICIAN_ID);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const loadVersion = useRef(0);

  async function loadJobs() {
    if (!supabaseConfigured) {
      setBackendError(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      setHydrated(true);
      return;
    }
    const version = loadVersion.current + 1;
    loadVersion.current = version;
    try {
      const nextJobs = await getJobs();
      if (version !== loadVersion.current) return;
      setJobs(nextJobs);
      setBackendError(null);
    } catch (error) {
      if (version !== loadVersion.current) return;
      setBackendError(
        error instanceof Error ? error.message : "The Supabase backend could not be reached.",
      );
    } finally {
      if (version === loadVersion.current) setHydrated(true);
    }
  }

  useEffect(() => {
    void loadJobs();
    if (!supabaseConfigured) return;
    const channel = supabase
      .channel("advantiq-demo-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => void loadJobs(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_tasks" },
        () => void loadJobs(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "required_items" },
        () => void loadJobs(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_updates" },
        () => void loadJobs(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setBackendError(
            "Live updates could not be connected. Check that the Supabase project is running.",
          );
        }
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function runMutation(mutation: () => Promise<void>) {
    try {
      await mutation();
      await loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The Supabase request failed.";
      setBackendError(message);
      throw error;
    }
  }

  const value: TechnicianContextValue = {
    hydrated,
    backendError,
    retry: () => void loadJobs(),
    technicianId,
    setTechnicianId: (id) => {
      if (technicians.some((technician) => technician.id === id)) setTechnicianId(id);
    },
    jobs,
    getJob: (id) => jobs.find((job) => job.id === id),
    isUpdateSeen: (job) => openEntries(job).length === 0,
    openUpdate: (job) => latestOpenEntry(job),
    markUpdateSeen: (jobId) => runMutation(() => markJobUpdatesSeen(jobId)),
    createJob: async (input) => {
      try {
        const created = await storeCreateJob(input);
        await loadJobs();
        return created;
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "The Supabase request failed.");
        throw error;
      }
    },
    editJob: (id, changes, opts) => runMutation(() => storeEditJob(id, changes, opts)),
    reassignJob: (id, technicianId, opts) =>
      runMutation(() => storeReassignJob(id, technicianId, opts)),
    resetDemo: () => runMutation(storeResetDemoData),
  };

  if (backendError && hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-gutter text-center text-foreground">
        <div className="max-w-md space-y-4">
          <h1 className="font-display text-2xl">Backend unavailable</h1>
          <p className="text-muted-foreground">{backendError}</p>
          <button
            className="min-h-tap rounded-2xl bg-primary px-5 font-bold text-primary-foreground"
            onClick={value.retry}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
}

export function useTechnician(): TechnicianContextValue {
  const context = useContext(TechnicianContext);
  if (!context) throw new Error("useTechnician must be used inside TechnicianProvider");
  return context;
}
