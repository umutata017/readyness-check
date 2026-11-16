import { describe, expect, it } from "vitest";
import { reportSubmissionReady } from "./store";

describe("report submission readiness", () => {
  it("requires a note when nothing to report is not selected", () => {
    expect(reportSubmissionReady({ notes: "   ", nothingToReport: false })).toBe(false);
  });

  it("allows a report with a note", () => {
    expect(reportSubmissionReady({ notes: "Completed the repair.", nothingToReport: false })).toBe(true);
  });

  it("allows a fast close with nothing to report", () => {
    expect(reportSubmissionReady({ notes: "", nothingToReport: true })).toBe(true);
  });
});
