// Dummy data for the prototype. Replace with real data source later.
export type Task = { id: string; label: string; changed?: boolean };
export type JobUpdate = { field: string; oldValue: string; newValue: string; taskId: string };
export type JobStatus = "not-started" | "ready" | "done";
export type Job = {
  id: string;
  technicianId: string;
  project: string;
  customer: string;
  address: string;
  timeslot: string;
  status: JobStatus;
  tasks: Task[];
  update?: JobUpdate;
};
export type Technician = { id: string; name: string };

export const SUPERVISOR_PHONE = "+31612345678";

export const technicians: Technician[] = [
  { id: "tech-a", name: "Technician A" },
  { id: "tech-b", name: "Technician B" },
];

export const jobs: Job[] = [
  {
    id: "J-2481",
    technicianId: "tech-a",
    project: "Boiler room renovation",
    customer: "Van Dijk Facilities",
    address: "Industrieweg 14, Utrecht",
    timeslot: "Today · 08:00 – 12:30",
    status: "not-started",
    tasks: [
      { id: "t1", label: "Isolate & drain heating circuit" },
      { id: "t2", label: "Remove old boiler" },
      { id: "t3", label: "Mount flue at 12 m — 15 m scissor lift", changed: true },
      { id: "t4", label: "Connect & pressure test" },
    ],
    update: { field: "Access equipment", oldValue: "10 m scissor lift", newValue: "15 m scissor lift", taskId: "t3" },
  },
  {
    id: "J-2482",
    technicianId: "tech-a",
    project: "Heat pump installation",
    customer: "Bakker & Zn",
    address: "Kanaalstraat 88, Amersfoort",
    timeslot: "Tomorrow · 09:00 – 15:00",
    status: "not-started",
    tasks: [
      { id: "t1", label: "Place outdoor unit on wall brackets" },
      { id: "t2", label: "Run refrigerant lines" },
      { id: "t3", label: "Wire indoor unit & thermostat" },
    ],
  },
  {
    id: "J-2490",
    technicianId: "tech-b",
    project: "Switchboard upgrade",
    customer: "De Groot Logistics",
    address: "Havenkade 3, Rotterdam",
    timeslot: "Today · 10:00 – 14:00",
    status: "ready",
    tasks: [
      { id: "t1", label: "De-energize main feed" },
      { id: "t2", label: "Replace switchboard" },
      { id: "t3", label: "Label circuits & test" },
    ],
  },
  {
    id: "J-2491",
    technicianId: "tech-b",
    project: "Ventilation maintenance",
    customer: "Stadion Park Offices",
    address: "Olympisch Stadion 21, Amsterdam",
    timeslot: "Yesterday · 08:00 – 12:00",
    status: "done",
    tasks: [
      { id: "t1", label: "Replace filters roof unit 1–3" },
      { id: "t2", label: "Check fan belts" },
    ],
  },
];

export function jobsForTechnician(technicianId: string): Job[] {
  return jobs.filter((j) => j.technicianId === technicianId);
}

export function getJob(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
}
