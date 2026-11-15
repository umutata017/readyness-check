import { describe, expect, it } from "vitest";
import { jobCode, jobNumberMeaning, jobs, openPartOrders, partOrderCode } from "./jobs";
import {
  displayStatus,
  matchesJobSearch,
  nextJobId,
  nextPartOrderSeq,
  openEntries,
  PART_ORDER_NEXT,
} from "./store";

describe("Supabase job data helpers", () => {
  it("finds the seeded unseen update", () => {
    expect(openEntries(jobs[0]!)).toHaveLength(1);
    expect(openEntries(jobs[0]!)![0]!.newValue).toBe("15 m scissor lift");
  });

  it("keeps the existing human-readable job id format", () => {
    expect(nextJobId(jobs)).toBe("J-2492");
  });

  it("gives each job a readable year-based number", () => {
    expect(jobCode(jobs[0]!)).toBe("J26-0001");
    expect(jobCode({ id: "x", number: { year: 2026, sequence: 42 } })).toBe("J26-0042");
    expect(jobCode({ id: "x", number: { year: 2027, sequence: 12345 } })).toBe("J27-12345");
    expect(jobNumberMeaning(jobs[0]!)).toBe("1st job of 2026");
    expect(jobNumberMeaning({ number: { year: 2026, sequence: 42 } })).toBe("42nd job of 2026");
    expect(jobNumberMeaning({ number: { year: 2026, sequence: 13 } })).toBe("13th job of 2026");
    expect(jobCode({ id: "J-2481" })).toBe("J-2481"); // before the migration is applied
  });

  it("finds a job by number however it is typed", () => {
    const job = { ...jobs[0]!, number: { year: 2026, sequence: 42 } };
    for (const query of ["J26-0042", "j26-0042", "J260042", "j26 42", "26-42", "0042", "42", "J26-00", "J-2481"]) {
      expect(matchesJobSearch(job, query)).toBe(true);
    }
    expect(matchesJobSearch(job, "43")).toBe(false);
    expect(matchesJobSearch(job, "2")).toBe(false); // the year alone is not a match
    expect(matchesJobSearch(job, "26-43")).toBe(false);
    expect(matchesJobSearch(job, "25-42")).toBe(false);
  });

  it("finds a job by customer or address", () => {
    const job = jobs[0]!;
    expect(matchesJobSearch(job, "van dijk")).toBe(true);
    expect(matchesJobSearch(job, "utrecht")).toBe(true);
    expect(matchesJobSearch(job, "rotterdam")).toBe(false);
    expect(matchesJobSearch(job, "")).toBe(true);
  });

  it("numbers part orders from the job number", () => {
    const job = {
      ...jobs[0]!,
      number: { year: 2026, sequence: 42 },
      parts: [
        { id: "a", seq: 1, part: "Flue kit 150 mm", quantity: 1, status: "delivered" as const, requestedBy: "tech-a", createdAt: "2026-11-15T09:00:00Z" },
        { id: "b", seq: 2, part: "Wall bracket", quantity: 2, status: "requested" as const, requestedBy: "supervisor", createdAt: "2026-11-15T10:00:00Z" },
      ],
    };
    expect(partOrderCode(job, job.parts[1]!)).toBe("J26-0042-P2");
    expect(nextPartOrderSeq(job)).toBe(3);
    expect(nextPartOrderSeq({ parts: [] })).toBe(1);
    expect(openPartOrders(job).map((o) => o.seq)).toEqual([2]);
    expect(matchesJobSearch(job, "J26-0042-P2")).toBe(true);
    expect(matchesJobSearch(job, "j26 0042 p1")).toBe(true);
    expect(matchesJobSearch(job, "J26-0042-P9")).toBe(false);
    expect(matchesJobSearch(job, "wall bracket")).toBe(true);
  });

  it("only lets a part order move forward", () => {
    expect(PART_ORDER_NEXT.requested).toEqual(["ordered", "cancelled"]);
    expect(PART_ORDER_NEXT.ordered).toEqual(["delivered", "cancelled"]);
    expect(PART_ORDER_NEXT.delivered).toEqual([]);
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
