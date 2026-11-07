// Dummy data for the prototype. Replace with real data source later.
export type Task = { id: string; label: string; changed?: boolean };
export type JobUpdate = { field: string; oldValue: string; newValue: string; taskId: string };
export type Job = {
  id: string; project: string; customer: string; address: string; timeslot: string;
  tasks: Task[]; update?: JobUpdate;
};

export const currentJob: Job = {
  id: "J-2481",
  project: "Boiler room renovation",
  customer: "Van Dijk Facilities",
  address: "Industrieweg 14, Utrecht",
  timeslot: "Today · 08:00 – 12:30",
  tasks: [
    { id: "t1", label: "Isolate & drain heating circuit" },
    { id: "t2", label: "Remove old boiler" },
    { id: "t3", label: "Mount flue at 12 m — 15 m scissor lift", changed: true },
    { id: "t4", label: "Connect & pressure test" },
  ],
  update: { field: "Access equipment", oldValue: "10 m scissor lift", newValue: "15 m scissor lift", taskId: "t3" },
};
