import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { TechnicianProvider, useTechnician } from "./technician";
import { jobs } from "@/data/jobs";

const seed = jobs.at(0);
if (!seed) throw new Error("Missing test seed");
const sample = seed;

function Probe() {
  const state = useTechnician();
  return <><span data-testid="project">{state.jobs[0]?.project}</span><span data-testid="count">{state.jobs.length}</span>
    <button onClick={() => {
      const created = state.createJob({ ...sample, tasks: ["Install"], items: [] });
      state.editJob(created.id, { project: "Created and edited" }, { notify: true });
    }}>Create</button>
    <button onClick={state.resetDemo}>Reset</button>
  </>;
}
beforeEach(() => window.localStorage.clear());
afterEach(cleanup);
it("restores supervisor edits after mounting without overwriting them with seed data", async () => {
  window.localStorage.setItem("advantiq-demo-state", JSON.stringify({ technicianId: "tech-b", jobs: [{ ...sample, project: "Saved update" }] }));
  render(<TechnicianProvider><Probe /></TechnicianProvider>);
  await waitFor(() => expect(screen.getByTestId("project").textContent).toBe("Saved update"));
  expect(JSON.parse(window.localStorage.getItem("advantiq-demo-state") ?? "{}").jobs[0].project).toBe("Saved update");
});
it("returns a newly created job immediately for subsequent edits and restores seeds on reset", () => {
  render(<TechnicianProvider><Probe /></TechnicianProvider>);
  fireEvent.click(screen.getByText("Create"));
  expect(screen.getByTestId("count").textContent).toBe("5");
  expect(JSON.parse(window.localStorage.getItem("advantiq-demo-state") ?? "{}").jobs[4].project).toBe("Created and edited");
  fireEvent.click(screen.getByText("Reset"));
  expect(screen.getByTestId("count").textContent).toBe("4");
  expect(screen.getByTestId("project").textContent).toBe("Boiler room renovation");
});