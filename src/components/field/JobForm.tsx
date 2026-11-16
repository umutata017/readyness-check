import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { JOB_TYPES, technicians } from "@/data/jobs";
import type { NewJobInput } from "@/data/store";
import { FieldButton } from "./FieldButton";
import { FieldLabel, FieldSelect, TextInput, Toggle, fieldControlClass } from "./inputs";
import { ItemListEditor, TaskListEditor } from "./JobFormParts";

export const emptyJobInput: NewJobInput = {
  project: "",
  customer: "",
  address: "",
  schedule: { date: "", start: "08:00", end: "12:00" },
  jobType: "Heating",
  technicianId: "tech-a",
  tasks: [""],
  items: [],
  workspaceAvailable: true,
};

export function JobForm({
  initial,
  editing = false,
  onSave,
}: {
  initial: NewJobInput;
  editing?: boolean;
  onSave: (
    input: NewJobInput,
    options: { message?: string; notify: boolean },
  ) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          ...draft,
          tasks: draft.tasks.map((t) => t.trim()).filter(Boolean),
          items: draft.items.map((i) => ({ ...i, label: i.label.trim() })).filter((i) => i.label),
        },
        { message: message.trim(), notify },
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The job could not be saved.");
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {(["project", "customer", "address"] as const).map((key) => (
          <label key={key} className="min-w-0">
            <FieldLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</FieldLabel>
            <TextInput
              required
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </label>
        ))}
        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="contents">
            <FieldLabel>Planned for</FieldLabel>
          </legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="col-span-2 min-w-0 sm:col-span-1">
              <span className="sr-only">Date</span>
              <TextInput
                type="date"
                required
                aria-label="Date"
                value={draft.schedule.date}
                onChange={(e) =>
                  setDraft({ ...draft, schedule: { ...draft.schedule, date: e.target.value } })
                }
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-sm font-bold text-muted-foreground">From</span>
              <TextInput
                type="time"
                required
                step={900}
                value={draft.schedule.start}
                onChange={(e) =>
                  setDraft({ ...draft, schedule: { ...draft.schedule, start: e.target.value } })
                }
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-sm font-bold text-muted-foreground">Until</span>
              <TextInput
                type="time"
                required
                step={900}
                value={draft.schedule.end}
                onChange={(e) =>
                  setDraft({ ...draft, schedule: { ...draft.schedule, end: e.target.value } })
                }
              />
            </label>
          </div>
        </fieldset>
        <label>
          <FieldLabel>Job type</FieldLabel>
          <FieldSelect
            value={draft.jobType}
            onChange={(e) => setDraft({ ...draft, jobType: e.target.value })}
          >
            {JOB_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </FieldSelect>
        </label>
        <label>
          <FieldLabel>Assigned technician</FieldLabel>
          <FieldSelect
            value={draft.technicianId}
            onChange={(e) => setDraft({ ...draft, technicianId: e.target.value })}
          >
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </FieldSelect>
        </label>
      </div>
      <TaskListEditor tasks={draft.tasks} onChange={(tasks) => setDraft({ ...draft, tasks })} />
      <ItemListEditor items={draft.items} onChange={(items) => setDraft({ ...draft, items })} />
      <Toggle
        label="Workspace available"
        checked={draft.workspaceAvailable}
        onChange={(workspaceAvailable) => setDraft({ ...draft, workspaceAvailable })}
      />
      {editing && (
        <>
          <label className="block">
            <FieldLabel>Message to technician (optional)</FieldLabel>
            <textarea
              className={fieldControlClass}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <Toggle label="Notify technician" checked={notify} onChange={setNotify} />
        </>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 font-semibold text-destructive"
        >
          {error}
        </p>
      )}
      <FieldButton type="submit" disabled={saving}>
        <Save className="size-6" />
        {editing ? "Save update" : "Create job"}
      </FieldButton>
    </form>
  );
}
