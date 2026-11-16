import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Download, ImagePlus, Trash2, X } from "lucide-react";
import { requesterName, type Job, type JobFile } from "@/data/jobs";
import { formatTime, jobFileDownloadUrl, jobPhotoUrls } from "@/data/store";
import { compressPhoto } from "@/lib/images";
import { useTechnician } from "@/state/technician";
import { FieldButton } from "./FieldButton";

/**
 * Photos taken on site. Technicians (and the supervisor) can take a photo with the
 * camera or pick them from the gallery; everyone on the job sees the thumbnails and
 * can open them full screen. The photographer or the supervisor can remove a photo.
 */
export function PhotosPanel({ job, role }: { job: Job; role: "technician" | "supervisor" }) {
  const { uploadFile, technicianId } = useTechnician();
  const photos = (job.files ?? []).filter((file) => file.kind === "photo");
  const urls = usePhotoUrls(photos);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const me = role === "supervisor" ? "supervisor" : technicianId;

  async function upload(list: FileList, input: HTMLInputElement | null) {
    const chosen = Array.from(list);
    const failed: string[] = [];
    setErrors([]);
    for (const [index, original] of chosen.entries()) {
      setProgress(chosen.length === 1 ? "Uploading photo…" : `Uploading ${index + 1} of ${chosen.length}…`);
      try {
        if (!original.type.startsWith("image/")) {
          throw new Error(`"${original.name}" is not a photo. Use Files for other documents.`);
        }
        await uploadFile(job.id, await compressPhoto(original), me, "photo");
      } catch (err) {
        failed.push(err instanceof Error ? err.message : `"${original.name}" could not be uploaded.`);
      }
    }
    setProgress(null);
    setErrors(failed);
    if (input) input.value = "";
  }

  const open = openIndex === null ? undefined : photos[openIndex];

  return (
    <section aria-label="Photos" className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
        Photos{photos.length > 0 && ` · ${photos.length}`}
      </h2>

      {photos.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-3 font-semibold text-muted-foreground">
          No photos yet.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Open photo ${index + 1} of ${photos.length}`}
                className="block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
              >
                {urls[photo.storagePath] && (
                  <img
                    src={urls[photo.storagePath]}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!job.cancellation && (
        <>
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-label="Take a photo"
            onChange={(e) => e.target.files?.length && void upload(e.target.files, e.target)}
          />
          <input
            ref={gallery}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Choose photos"
            onChange={(e) => e.target.files?.length && void upload(e.target.files, e.target)}
          />
          {progress ? (
            <FieldButton variant="tile" className="flex-row text-base" disabled>
              {progress}
            </FieldButton>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FieldButton className="text-base" onClick={() => camera.current?.click()}>
                <Camera className="size-5" />
                Take photo
              </FieldButton>
              <FieldButton
                variant="tile"
                className="flex-row text-base"
                onClick={() => gallery.current?.click()}
              >
                <ImagePlus className="size-5" />
                From gallery
              </FieldButton>
            </div>
          )}
        </>
      )}

      {errors.map((message) => (
        <p key={message} role="alert" className="font-semibold text-cancel-foreground">
          {message}
        </p>
      ))}

      {open && openIndex !== null && (
        <PhotoViewer
          photos={photos}
          index={openIndex}
          urls={urls}
          canRemove={(photo) => role === "supervisor" || photo.uploadedBy === me}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}

/** Fetches viewable links for the photos, only for ones it does not have yet. */
function usePhotoUrls(photos: JobFile[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = photos.map((photo) => photo.storagePath).join("|");
  useEffect(() => {
    const missing = photos.map((photo) => photo.storagePath).filter((path) => !urls[path]);
    if (missing.length === 0) return;
    let cancelled = false;
    jobPhotoUrls(missing)
      .then((fresh) => !cancelled && setUrls((current) => ({ ...current, ...fresh })))
      .catch(() => undefined); // thumbnails stay grey; the photo list itself still shows
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the set of photos changes
  }, [key]);
  return urls;
}

function PhotoViewer({
  photos,
  index,
  urls,
  canRemove,
  onIndexChange,
  onClose,
}: {
  photos: JobFile[];
  index: number;
  urls: Record<string, string>;
  canRemove: (photo: JobFile) => boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { deleteFile } = useTechnician();
  const closeButton = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photo = photos[index]!;
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const go = (next: number) => {
    setConfirming(false);
    setError(null);
    onIndexChange(next);
  };

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) go(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers read the latest index
  }, [index, photos.length]);

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      onTouchStart={(e) => (touchStart.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        const end = e.changedTouches[0]?.clientX;
        touchStart.current = null;
        if (start === null || end === undefined || Math.abs(end - start) < 50) return;
        if (end < start && hasNext) go(index + 1);
        if (end > start && hasPrev) go(index - 1);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="font-bold">
          {index + 1} / {photos.length}
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="grid size-tap place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <X className="size-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 py-3">
        {urls[photo.storagePath] ? (
          <img
            src={urls[photo.storagePath]}
            alt={`Photo ${index + 1} of ${photos.length}`}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        ) : (
          <p className="font-semibold text-white/70">Loading photo…</p>
        )}
        {hasPrev && (
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 grid size-tap -translate-y-1/2 place-items-center rounded-full bg-black/50 hover:bg-black/70"
          >
            <ChevronLeft className="size-7" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 grid size-tap -translate-y-1/2 place-items-center rounded-full bg-black/50 hover:bg-black/70"
          >
            <ChevronRight className="size-7" />
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-center text-sm font-semibold text-white/80">
          {requesterName(photo.uploadedBy)} · {formatTime(photo.createdAt)}
        </p>
        {confirming ? (
          <div className="grid grid-cols-2 gap-2">
            <FieldButton
              variant="danger"
              className="text-base"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await deleteFile(photo);
                  if (photos.length === 1) onClose();
                  else go(Math.max(0, index - (hasNext ? 0 : 1)));
                }, "The photo could not be removed.")
              }
            >
              <Trash2 className="size-5" />
              {busy ? "Removing…" : "Remove"}
            </FieldButton>
            <FieldButton
              variant="tile"
              className="flex-row text-base"
              onClick={() => setConfirming(false)}
            >
              Keep photo
            </FieldButton>
          </div>
        ) : (
          <div className={`grid gap-2 ${canRemove(photo) ? "grid-cols-[minmax(0,1fr)_auto]" : ""}`}>
            <FieldButton
              variant="tile"
              className="min-h-tap flex-row py-2 text-base"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  window.location.href = await jobFileDownloadUrl(photo);
                }, "The photo could not be downloaded.")
              }
            >
              <Download className="size-5" />
              Download
            </FieldButton>
            {canRemove(photo) && (
              <FieldButton
                variant="tile"
                aria-label="Remove photo"
                className="min-h-tap w-tap flex-row p-0"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-5" />
              </FieldButton>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-cancel-border">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
