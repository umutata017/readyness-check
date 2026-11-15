import { useState } from "react";
import { CheckCircle2, Package, PackageCheck, Plus, Truck, X } from "lucide-react";
import {
  PART_ORDER_STATUS_LABELS,
  partOrderCode,
  requesterName,
  type Job,
  type PartOrder,
  type PartOrderStatus,
} from "@/data/jobs";
import { formatTime } from "@/data/store";
import { cn } from "@/lib/utils";
import { useTechnician } from "@/state/technician";
import { FieldButton } from "./FieldButton";
import { FieldLabel, TextInput, fieldControlClass } from "./inputs";

export const partStatusStyle: Record<PartOrderStatus, string> = {
  requested: "border border-change-border bg-pending text-change-foreground",
  ordered: "border border-input bg-accent text-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "border border-cancel-border bg-cancel-surface text-cancel-foreground",
};

/**
 * Parts ordered for a job, numbered from the job number (J26-0042-P1).
 * Technicians and the supervisor can order; the supervisor moves an order to
 * Ordered and Delivered; a technician can withdraw a request that is not ordered yet.
 */
export function PartsPanel({ job, role }: { job: Job; role: "technician" | "supervisor" }) {
  const orders = job.parts ?? [];
  const [formOpen, setFormOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const canOrder = !job.cancellation;

  return (
    <section aria-label="Parts" className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
        Parts
      </h2>

      {orders.length === 0 && !formOpen && (
        <p className="rounded-2xl border border-border bg-card px-4 py-3 font-semibold text-muted-foreground">
          No parts ordered for this job.
        </p>
      )}

      {orders.map((order) => (
        <PartOrderCard key={order.id} job={job} order={order} role={role} />
      ))}

      {confirmation && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-success bg-card px-4 py-3 font-bold text-success"
        >
          <CheckCircle2 className="size-5 shrink-0" />
          {confirmation}
        </p>
      )}

      {canOrder &&
        (formOpen ? (
          <OrderPartForm
            job={job}
            role={role}
            onDone={(message) => {
              setFormOpen(false);
              setConfirmation(message);
            }}
            onCancel={() => setFormOpen(false)}
          />
        ) : (
          <FieldButton
            variant="tile"
            className="flex-row text-base"
            onClick={() => {
              setConfirmation(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-5" />
            Order a part
          </FieldButton>
        ))}
    </section>
  );
}

function PartOrderCard({
  job,
  order,
  role,
}: {
  job: Job;
  order: PartOrder;
  role: "technician" | "supervisor";
}) {
  const { setPartOrderStatus } = useTechnician();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(status: PartOrderStatus) {
    setSaving(true);
    setError(null);
    try {
      await setPartOrderStatus(order.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The order could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  const supervisor = role === "supervisor";
  const done = order.status === "delivered" || order.status === "cancelled";

  return (
    <article
      className={cn(
        "rounded-3xl border-2 p-4",
        order.status === "cancelled" ? "border-border bg-secondary" : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold tracking-wider text-muted-foreground">
            {partOrderCode(job, order)}
          </p>
          <p
            className={cn(
              "mt-1 break-words text-lg font-bold",
              order.status === "cancelled" && "text-muted-foreground line-through",
            )}
          >
            {order.part} <span className="whitespace-nowrap">× {order.quantity}</span>
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-sm font-bold",
            partStatusStyle[order.status],
          )}
        >
          {PART_ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>
      {order.note && <p className="mt-1 font-semibold text-muted-foreground">“{order.note}”</p>}
      <ul className="mt-2 space-y-0.5 text-sm font-semibold text-muted-foreground">
        <li>
          Requested by {requesterName(order.requestedBy)} · {formatTime(order.createdAt)}
        </li>
        {order.orderedAt && <li>Ordered · {formatTime(order.orderedAt)}</li>}
        {order.deliveredAt && <li className="text-success">Delivered · {formatTime(order.deliveredAt)}</li>}
        {order.cancelledAt && <li>Cancelled · {formatTime(order.cancelledAt)}</li>}
      </ul>

      {!done && !job.cancellation && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {supervisor && order.status === "requested" && (
            <FieldButton disabled={saving} onClick={() => void move("ordered")} className="text-base">
              <Truck className="size-5" />
              Mark ordered
            </FieldButton>
          )}
          {supervisor && order.status === "ordered" && (
            <FieldButton
              variant="success"
              disabled={saving}
              onClick={() => void move("delivered")}
              className="text-base"
            >
              <PackageCheck className="size-5" />
              Mark delivered
            </FieldButton>
          )}
          {(supervisor || order.status === "requested") && (
            <FieldButton
              variant="tile"
              disabled={saving}
              onClick={() => void move("cancelled")}
              className="flex-row text-base"
            >
              <X className="size-5" />
              {supervisor ? "Cancel order" : "Withdraw request"}
            </FieldButton>
          )}
          {!supervisor && order.status === "ordered" && (
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground sm:col-span-2">
              <Truck className="size-4 shrink-0" />
              On its way. The supervisor marks it delivered.
            </p>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 font-semibold text-cancel-foreground">
          {error}
        </p>
      )}
    </article>
  );
}

function OrderPartForm({
  job,
  role,
  onDone,
  onCancel,
}: {
  job: Job;
  role: "technician" | "supervisor";
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const { orderPart, technicianId } = useTechnician();
  const [part, setPart] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      aria-label="Order a part"
      className="space-y-4 rounded-3xl border-2 border-input bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          const seq = await orderPart(job.id, {
            part,
            quantity: Number(quantity),
            note,
            requestedBy: role === "supervisor" ? "supervisor" : technicianId,
          });
          onDone(`Order ${partOrderCode(job, { seq })} sent`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "The part could not be ordered.");
          setSaving(false);
        }
      }}
    >
      <h3 className="flex items-center gap-2 font-display text-xl">
        <Package className="size-6" />
        Order a part
      </h3>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <label className="block">
          <FieldLabel>Part</FieldLabel>
          <TextInput
            value={part}
            required
            autoFocus
            placeholder="E.g. Flue kit 150 mm"
            onChange={(e) => setPart(e.target.value)}
          />
        </label>
        <label className="block">
          <FieldLabel>Quantity</FieldLabel>
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
      </div>
      <label className="block">
        <FieldLabel>Note (optional)</FieldLabel>
        <textarea
          className={fieldControlClass}
          rows={2}
          value={note}
          placeholder="E.g. needed before Thursday, brand or size"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-cancel-foreground">
          {error}
        </p>
      )}
      <FieldButton type="submit" disabled={saving}>
        <Package className="size-6" />
        {saving ? "Sending…" : "Send order"}
      </FieldButton>
      <FieldButton type="button" variant="tile" className="flex-row text-base" onClick={onCancel}>
        Cancel
      </FieldButton>
    </form>
  );
}
