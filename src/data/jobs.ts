// Dummy data for the prototype. Replace with real data source later.
export type Task = { id: string; label: string; changed?: boolean };
export type JobStatus = "not-started" | "ready" | "done";
export type ItemKind = "equipment" | "personnel" | "material";
export type RequiredItem = { id: string; label: string; kind: ItemKind };
export type UpdateKind = "created" | "assigned" | "reassigned" | "edited";
export type UpdateEntry = {
  id: string;
  at: string; // ISO timestamp
  kind: UpdateKind;
  field: string;
  oldValue: string;
  newValue: string;
  taskId?: string;
  message?: string;
  notify: boolean; // whether the technician gets a banner for this update
  seenAt?: string; // set when the technician taps "Seen"
};
export type Job = {
  id: string;
  technicianId: string;
  project: string;
  customer: string;
  address: string;
  timeslot: string;
  jobType: string;
  status: JobStatus;
  tasks: Task[];
  items: RequiredItem[];
  workspaceAvailable: boolean;
  history: UpdateEntry[];
};
export type Technician = { id: string; name: string };

export const SUPERVISOR_PHONE = "+31612345678";

export const JOB_TYPES = ["Heating", "Electrical", "Mechanical", "Welding"] as const;

export const technicians: Technician[] = [
  { id: "tech-a", name: "Technician A" },
  { id: "tech-b", name: "Technician B" },
];

export function technicianName(id: string): string {
  return technicians.find((t) => t.id === id)?.name ?? id;
}

export const jobs: Job[] = [
  {
    id: "J-2481",
    technicianId: "tech-a",
    project: "Boiler room renovation",
    customer: "Van Dijk Facilities",
    address: "Industrieweg 14, Utrecht",
    timeslot: "Today · 08:00 – 12:30",
    jobType: "Heating",
    status: "not-started",
    tasks: [
      { id: "t1", label: "Isolate & drain heating circuit" },
      { id: "t2", label: "Remove old boiler" },
      { id: "t3", label: "Mount flue at 12 m — 15 m scissor lift", changed: true },
      { id: "t4", label: "Connect & pressure test" },
    ],
    items: [
      { id: "i1", label: "15 m scissor lift", kind: "equipment" },
      { id: "i2", label: "Flue kit 150 mm", kind: "material" },
      { id: "i3", label: "2 technicians", kind: "personnel" },
    ],
    workspaceAvailable: true,
    history: [
      {
        id: "u-2481-1",
        at: "2026-11-06T15:40:00Z",
        kind: "created",
        field: "Job",
        oldValue: "",
        newValue: "Boiler room renovation",
        notify: true,
        seenAt: "2026-11-06T16:02:00Z",
      },
      {
        id: "u-2481-2",
        at: "2026-11-07T07:12:00Z",
        kind: "edited",
        field: "Access equipment",
        oldValue: "10 m scissor lift",
        newValue: "15 m scissor lift",
        taskId: "t3",
        message: "Ceiling is higher than measured.",
        notify: true,
      },
    ],
  },
  {
    id: "J-2482",
    technicianId: "tech-a",
    project: "Heat pump installation",
    customer: "Bakker & Zn",
    address: "Kanaalstraat 88, Amersfoort",
    timeslot: "Tomorrow · 09:00 – 15:00",
    jobType: "Mechanical",
    status: "not-started",
    tasks: [
      { id: "t1", label: "Place outdoor unit on wall brackets" },
      { id: "t2", label: "Run refrigerant lines" },
      { id: "t3", label: "Wire indoor unit & thermostat" },
    ],
    items: [
      { id: "i1", label: "Wall bracket set", kind: "material" },
      { id: "i2", label: "Vacuum pump", kind: "equipment" },
      { id: "i3", label: "2 technicians", kind: "personnel" },
    ],
    workspaceAvailable: true,
    history: [
      {
        id: "u-2482-1",
        at: "2026-11-05T10:00:00Z",
        kind: "created",
        field: "Job",
        oldValue: "",
        newValue: "Heat pump installation",
        notify: true,
        seenAt: "2026-11-05T12:30:00Z",
      },
    ],
  },
  {
    id: "J-2490",
    technicianId: "tech-b",
    project: "Switchboard upgrade",
    customer: "De Groot Logistics",
    address: "Havenkade 3, Rotterdam",
    timeslot: "Today · 10:00 – 14:00",
    jobType: "Electrical",
    status: "ready",
    tasks: [
      { id: "t1", label: "De-energize main feed" },
      { id: "t2", label: "Replace switchboard" },
      { id: "t3", label: "Label circuits & test" },
    ],
    items: [
      { id: "i1", label: "New switchboard 40A", kind: "material" },
      { id: "i2", label: "Voltage tester", kind: "equipment" },
    ],
    workspaceAvailable: true,
    history: [
      {
        id: "u-2490-1",
        at: "2026-11-04T09:00:00Z",
        kind: "created",
        field: "Job",
        oldValue: "",
        newValue: "Switchboard upgrade",
        notify: true,
        seenAt: "2026-11-04T09:20:00Z",
      },
    ],
  },
  {
    id: "J-2491",
    technicianId: "tech-b",
    project: "Ventilation maintenance",
    customer: "Stadion Park Offices",
    address: "Olympisch Stadion 21, Amsterdam",
    timeslot: "Yesterday · 08:00 – 12:00",
    jobType: "Mechanical",
    status: "done",
    tasks: [
      { id: "t1", label: "Replace filters roof unit 1–3" },
      { id: "t2", label: "Check fan belts" },
    ],
    items: [{ id: "i1", label: "Filter set F7", kind: "material" }],
    workspaceAvailable: false,
    history: [
      {
        id: "u-2491-1",
        at: "2026-11-03T08:00:00Z",
        kind: "created",
        field: "Job",
        oldValue: "",
        newValue: "Ventilation maintenance",
        notify: true,
        seenAt: "2026-11-03T08:15:00Z",
      },
    ],
  },
];
