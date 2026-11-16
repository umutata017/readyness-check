const MAX_SIDE = 2000; // px — sharp enough to read a label or a serial plate
const QUALITY = 0.82;
const SMALL_ENOUGH = 1.5 * 1024 * 1024;

/** Longest side scaled down to `maxSide`, keeping the aspect ratio. */
export function fitWithin(width: number, height: number, maxSide = MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Shrinks a phone photo (often 5–10 MB) to a JPEG of a few hundred KB before upload,
 * so it goes through on a weak mobile connection. Keeps the photo upright.
 * Anything the browser cannot decode (e.g. HEIC outside Safari) is uploaded as it is.
 */
export async function compressPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || /gif|svg/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const size = fitWithin(bitmap.width, bitmap.height);
    if (size.width === bitmap.width && file.size <= SMALL_ENOUGH) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}
