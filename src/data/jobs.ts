// Dummy data for the prototype. Replace with real data source later.
export type Task = { id: string; label: string; changed?: boolean };
export type JobStatus = "not-started" | "ready" | "done";
export type ItemKind = "equipment" | "personnel" | "material";
export type RequiredItem = {
  id: string;
  label: string;
  kind: ItemKind;
  checked?: boolean;
  locationStatus?: string | undefined;
};
export type UpdateKind =
  | "created"
  | "assigned"
  | "reassigned"
  | "edited"
  | "ready"
  | "cancelled";
export type CancelReason = "resident" | "supervisor";
export const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  resident: "Cancelled by resident",
  supervisor: "Cancelled by supervisor",
};
export type Cancellation = { reason: CancelReason; note?: string | undefined; at: string };
export type UpdateEntry = {
  id: string;
  at: string; // ISO timestamp
  kind: UpdateKind;
  field: string;
  oldValue: string;
  newValue: string;
  taskId?: string | undefined;
  message?: string | undefined;
  notify: boolean; // whether the technician gets a banner for this update
  seenAt?: string | undefined; // set when the technician taps "Seen"
};
export type PartOrderStatus = "requested" | "ordered" | "delivered" | "cancelled";
export const PART_ORDER_STATUS_LABELS: Record<PartOrderStatus, string> = {
  requested: "Requested",
  ordered: "Ordered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
/** A part ordered for a job. `seq` numbers the orders within the job: J26-0042-P1, -P2, … */
export type PartOrder = {
  id: string;
  seq: number;
  part: string;
  quantity: number;
  note?: string | undefined;
  status: PartOrderStatus;
  requestedBy: string; // technician id or "supervisor"
  createdAt: string;
  orderedAt?: string | undefined;
  deliveredAt?: string | undefined;
  cancelledAt?: string | undefined;
};

/** Year-based job number, e.g. J26-0042 = the 42nd job created in 2026. */
export type JobNumber = { year: number; sequence: number };
export type Job = {
  id: string;
  number?: JobNumber | undefined; // missing until the job-number migration is applied
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
  parts?: PartOrder[] | undefined; // empty until the part-orders migration is applied
  cancellation?: Cancellation | undefined; // set when a supervisor removes the job
};
export type Technician = { id: string; name: string };

/** The code people say, search for and print on labels, e.g. "J26-0042". */
export function jobCode(job: Pick<Job, "id" | "number">): string {
  if (!job.number) return job.id;
  const year = String(job.number.year % 100).padStart(2, "0");
  return `J${year}-${String(job.number.sequence).padStart(4, "0")}`;
}

function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

/** Order number that carries the job number, e.g. "J26-0042-P1". */
export function partOrderCode(job: Pick<Job, "id" | "number">, order: Pick<PartOrder, "seq">): string {
  return `${jobCode(job)}-P${order.seq}`;
}

/** Orders still waiting for something: requested or ordered, not yet delivered. */
export function openPartOrders(job: Pick<Job, "parts">): PartOrder[] {
  return (job.parts ?? []).filter((o) => o.status === "requested" || o.status === "ordered");
}

/** Who asked for the part, in words. */
export function requesterName(requestedBy: string): string {
  return requestedBy === "supervisor" ? "Supervisor" : technicianName(requestedBy);
}

/** Plain-language meaning of the job code, e.g. "42nd job of 2026". */
export function jobNumberMeaning(job: Pick<Job, "number">): string | undefined {
  return job.number ? `${ordinal(job.number.sequence)} job of ${job.number.year}` : undefined;
}

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
    number: { year: 2026, sequence: 1 },
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
    number: { year: 2026, sequence: 2 },
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
    number: { year: 2026, sequence: 3 },
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
    number: { year: 2026, sequence: 4 },
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
