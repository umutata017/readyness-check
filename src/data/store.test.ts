import { describe, expect, it } from "vitest";
import { jobs } from "./jobs";
import { displayStatus, nextJobId, openEntries } from "./store";

describe("Supabase job data helpers", () => {
  it("finds the seeded unseen update", () => {
    expect(openEntries(jobs[0]!)).toHaveLength(1);
    expect(openEntries(jobs[0]!)![0]!.newValue).toBe("15 m scissor lift");
  });

  it("keeps the existing human-readable job id format", () => {
    expect(nextJobId(jobs)).toBe("J-2492");
  });

  it("shows a cancelled job as cancelled even when it has an unseen update", () => {
    const job = jobs[0]!;
    expect(displayStatus(job, true)).toBe("updated");
    expect(displayStatus(job, false)).toBe(job.status);
    const cancelled = { ...job, cancellation: { reason: "resident" as const, at: "2026-11-10T09:00:00Z" } };
    expect(displayStatus(cancelled, true)).toBe("cancelled");
  });

  it("does not treat acknowledged updates as open", () => {
    expect(openEntries(jobs[1]!)).toHaveLength(0);
  });
});
