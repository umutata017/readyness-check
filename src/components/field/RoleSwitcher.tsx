import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { technicians } from "@/data/jobs";
import { useTechnician } from "@/state/technician";

const SUPERVISOR = "supervisor";

/** Top-right menu for switching between technicians and the supervisor view; identical on every role's home screen. */
export function RoleSwitcher({ supervisor = false }: { supervisor?: boolean }) {
  const { technicianId, setTechnicianId } = useTechnician();
  const navigate = useNavigate();
  return (
    <label className="relative flex shrink-0 items-center">
      <span className="sr-only">Choose technician or supervisor</span>
      <select
        value={supervisor ? SUPERVISOR : technicianId}
        onChange={(e) => {
          if (e.target.value === SUPERVISOR) {
            void navigate({ to: "/supervisor" });
          } else {
            setTechnicianId(e.target.value);
            if (supervisor) void navigate({ to: "/" });
          }
        }}
        className="min-h-tap appearance-none rounded-full border border-input bg-card py-2 pl-4 pr-10 text-base font-bold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        {technicians.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
        <option value={SUPERVISOR}>Supervisor</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-5 text-foreground" aria-hidden />
    </label>
  );
}
