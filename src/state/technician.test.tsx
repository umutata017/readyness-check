import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabaseConfigured: false,
  supabase: {},
}));

import { TechnicianProvider } from "./technician";

describe("TechnicianProvider", () => {
  it("reports missing Supabase configuration clearly", async () => {
    render(
      <TechnicianProvider>
        <p>content</p>
      </TechnicianProvider>,
    );

    expect(await screen.findByText("Backend unavailable")).toBeInTheDocument();
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument();
  });
});
