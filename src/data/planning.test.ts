import { describe, expect, it } from "vitest";
import { jobs, type Job } from "./jobs";
import {
  findOverlaps,
  formatSchedule,
  jobTimeslot,
  jobsOnDay,
  scheduleDraftFromJob,
  scheduleFromDraft,
  startOfWeek,
  weekDays,
} from "./planning";

// Local times, so the tests pass in any timezone.
const at = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();
const planned = (id: string, technicianId: string, date: string, start: string, end: string): Job => ({
  ...jobs[0]!,
  id,
  technicianId,
  schedule: { start: at(date, start), end: at(date, end) },
});

describe("planning helpers", () => {
  it("starts the week on Monday", () => {
    const sunday = new Date(2026, 10, 22, 15); // Sun 22 Nov 2026
    expect(startOfWeek(sunday)).toEqual(new Date(2026, 10, 16)); // Mon 16 Nov
    expect(startOfWeek(new Date(2026, 10, 16, 0, 0))).toEqual(new Date(2026, 10, 16));
    expect(weekDays(new Date(2026, 10, 16)).map((d) => d.getDate())).toEqual([16, 17, 18, 19, 20, 21, 22]);
  });

  it("labels the timeslot relative to today", () => {
    const now = new Date(2026, 10, 16, 9); // Mon 16 Nov
    const schedule = (date: string) => ({ start: at(date, "08:00"), end: at(date, "12:30") });
    expect(formatSchedule(schedule("2026-11-16"), now)).toBe("Today · 08:00 – 12:30");
    expect(formatSchedule(schedule("2026-11-17"), now)).toBe("Tomorrow · 08:00 – 12:30");
    expect(formatSchedule(schedule("2026-11-15"), now)).toBe("Yesterday · 08:00 – 12:30");
    expect(formatSchedule(schedule("2026-11-19"), now)).toBe("Thu 19 Nov · 08:00 – 12:30");
    expect(jobTimeslot({ timeslot: "Old text" })).toBe("Old text");
  });

  it("round-trips the form's date and times", () => {
    const draft = { date: "2026-11-18", start: "07:45", end: "16:00" };
    const schedule = scheduleFromDraft(draft);
    expect(scheduleDraftFromJob({ schedule })).toEqual(draft);
  });

  it("rejects an end time before the start", () => {
    expect(() => scheduleFromDraft({ date: "2026-11-18", start: "12:00", end: "09:00" })).toThrow(
      "The end time must be after the start time.",
    );
    expect(() => scheduleFromDraft({ date: "", start: "08:00", end: "09:00" })).toThrow(
      "Choose the date of the job.",
    );
  });

  it("lists a day's jobs in time order", () => {
    const late = planned("late", "tech-a", "2026-11-18", "13:00", "15:00");
    const early = planned("early", "tech-a", "2026-11-18", "08:00", "10:00");
    const otherDay = planned("other", "tech-a", "2026-11-19", "08:00", "10:00");
    expect(jobsOnDay([late, otherDay, early], new Date(2026, 10, 18)).map((j) => j.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("flags double bookings for the same technician only", () => {
    const a = planned("a", "tech-a", "2026-11-18", "08:00", "12:00");
    const b = planned("b", "tech-a", "2026-11-18", "11:00", "14:00");
    const touching = planned("c", "tech-a", "2026-11-18", "14:00", "15:00");
    const otherTech = planned("d", "tech-b", "2026-11-18", "08:00", "12:00");
    const cancelled = { ...planned("e", "tech-a", "2026-11-18", "09:00", "10:00"), cancellation: { reason: "resident" as const, at: "" } };
    const overlaps = findOverlaps([a, b, touching, otherTech, cancelled]);
    expect(overlaps.get("a")?.map((j) => j.id)).toEqual(["b"]);
    expect(overlaps.get("b")?.map((j) => j.id)).toEqual(["a"]);
    expect(overlaps.has("c")).toBe(false);
    expect(overlaps.has("d")).toBe(false);
    expect(overlaps.has("e")).toBe(false);
  });
});
