import { Plus, X } from "lucide-react";
import type { ItemKind } from "@/data/jobs";
import { FieldLabel, FieldSelect, TextInput } from "@/components/field/inputs";

export type ItemDraft = { label: string; kind: ItemKind };

const ITEM_KINDS: { value: ItemKind; label: string }[] = [
  { value: "equipment", label: "Equipment" },
  { value: "personnel", label: "Personnel" },
  { value: "material", label: "Material" },
];

/** Editable list of task lines (add / remove), shared by the new-job and edit-job forms. */
export function TaskListEditor({ tasks, onChange }: { tasks: string[]; onChange: (tasks: string[]) => void }) {
  return (
    <div>
      <FieldLabel>Tasks</FieldLabel>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={task}
              placeholder={`Task ${i + 1}`}
              onChange={(e) => onChange(tasks.map((t, j) => (j === i ? e.target.value : t)))}
            />
            <button
              type="button"
              aria-label={`Remove task ${i + 1}`}
              onClick={() => onChange(tasks.filter((_, j) => j !== i))}
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
            >
              <X className="size-5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...tasks, ""])}
          className="flex min-h-tap w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3 text-base font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <Plus className="size-5" /> Add task
        </button>
      </div>
    </div>
  );
}

/** Editable list of required items (label + kind), shared by the new-job and edit-job forms. */
export function ItemListEditor({ items, onChange }: { items: ItemDraft[]; onChange: (items: ItemDraft[]) => void }) {
  return (
    <div>
      <FieldLabel>Required items</FieldLabel>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={item.label}
              placeholder="e.g. 15 m scissor lift"
              onChange={(e) => onChange(items.map((it, j) => (j === i ? { ...it, label: e.target.value } : it)))}
            />
            <FieldSelect
              aria-label={`Kind for item ${i + 1}`}
              value={item.kind}
              onChange={(e) => onChange(items.map((it, j) => (j === i ? { ...it, kind: e.target.value as ItemKind } : it)))}
              className="w-36 shrink-0 px-3"
            >
              {ITEM_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </FieldSelect>
            <button
              type="button"
              aria-label={`Remove item ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
            >
              <X className="size-5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, { label: "", kind: "equipment" }])}
          className="flex min-h-tap w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3 text-base font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <Plus className="size-5" /> Add item
        </button>
      </div>
    </div>
  );
}
