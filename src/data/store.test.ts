import { describe, expect, it } from "vitest";
import { jobs } from "./jobs";
import { createJob, editJob, markJobUpdatesSeen, openEntries, reassignJob } from "./store";

const at = "2026-11-08T20:43:00Z";
describe("Supervisor job updates", () => {
  it("creates an assigned, not-started job with an unseen notification", () => {
    const next = createJob(jobs, { ...jobs[0], technicianId: "tech-b", tasks: ["Install lift"], items: [] }, at);
    const job = next.at(-1);
    expect(job?.id).toBe("J-2492");
    expect(job?.technicianId).toBe("tech-b");
    expect(job?.status).toBe("not-started");
    expect(job?.history[0]).toMatchObject({ kind: "created", notify: true, at });
    expect(job?.history[0].seenAt).toBeUndefined();
  });
  it("records old and new values and the supervisor message", () => {
    const next = editJob(jobs, "J-2481", { address: "New address" }, { notify: true, message: "Use rear access" }, at);
    expect(next[0].history.at(-1)).toMatchObject({ field: "Address", oldValue: "Industrieweg 14, Utrecht", newValue: "New address", message: "Use rear access", notify: true });
  });
  it("does not add an open notification when notify is off", () => {
    const seen = markJobUpdatesSeen(jobs, "J-2481", at);
    const next = editJob(seen, "J-2481", { address: "Quiet edit" }, { notify: false }, at);
    expect(openEntries(next[0])).toHaveLength(0);
    expect(next[0].history.at(-1)?.notify).toBe(false);
  });
  it("moves a reassigned job to the new technician and notifies them", () => {
    const next = reassignJob(jobs, "J-2481", "tech-b", { notify: true }, at);
    expect(next.filter((job) => job.technicianId === "tech-a").map((job) => job.id)).not.toContain("J-2481");
    expect(next.filter((job) => job.technicianId === "tech-b").map((job) => job.id)).toContain("J-2481");
    expect(next[0].history.at(-1)).toMatchObject({ oldValue: "Technician A", newValue: "Technician B", notify: true });
  });
  it("stamps all open updates with the Seen time", () => {
    const edited = editJob(jobs, "J-2481", { address: "New address" }, { notify: true }, at);
    const next = markJobUpdatesSeen(edited, "J-2481", at);
    expect(openEntries(next[0])).toHaveLength(0);
    expect(next[0].history.slice(1).map((entry) => entry.seenAt)).toEqual([at, at]);
    expect(next[1]).toBe(edited[1]);
  });
  it("tracks task changes against the highlighted task id", () => {
    const next = editJob(jobs, "J-2481", { tasks: jobs[0].tasks.map((task, i) => i === 2 ? "Mount flue — 20 m lift" : task.label) }, { notify: true }, at);
    expect(next[0].history.at(-1)).toMatchObject({ taskId: "t3", oldValue: "Mount flue at 12 m — 15 m scissor lift", newValue: "Mount flue — 20 m lift" });
  });
  it("saves and records an item category change without changing its label", () => {
    const next = editJob(jobs, "J-2481", { items: jobs[0].items.map((item, i) => i === 0 ? { ...item, kind: "material" } : item) }, { notify: true }, at);
    expect(next[0].items[0].kind).toBe("material");
    expect(next[0].history).toHaveLength(jobs[0].history.length + 1);
  });
  it("does not append history for unchanged values", () => {
    const next = editJob(jobs, "J-2481", { project: jobs[0].project }, { notify: true }, at);
    expect(next[0].history).toEqual(jobs[0].history);
  });
});