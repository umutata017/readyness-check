import { describe, expect, it } from "vitest";
import { jobs } from "./jobs";
import { nextJobId, openEntries } from "./store";

describe("Supabase job data helpers", () => {
  it("finds the seeded unseen update", () => {
    expect(openEntries(jobs[0]!)).toHaveLength(1);
    expect(openEntries(jobs[0]!)![0]!.newValue).toBe("15 m scissor lift");
  });

  it("keeps the existing human-readable job id format", () => {
    expect(nextJobId(jobs)).toBe("J-2492");
  });

  it("does not treat acknowledged updates as open", () => {
    expect(openEntries(jobs[1]!)).toHaveLength(0);
  });
});
