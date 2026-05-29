// Client-only helpers for turning an uploaded image into a compact, square-ish
// data URL we can carry through the generator without a file-storage backend.

const MAX_DIM = 512;
const MAX_BYTES = 6 * 1024 * 1024; // reject obviously-too-large originals

export interface ReadImageResult {
  dataUrl: string;
}

export async function fileToResizedDataUrl(file: File): Promise<ReadImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is too large — pick one under 6 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = scaledSize(img.naturalWidth, img.naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // No canvas (rare) — fall back to the raw file as a data URL.
      return { dataUrl: await fileToDataUrl(file) };
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    // PNG keeps logos/transparency crisp; JPEG would be smaller but flatten alpha.
    const preferJpeg = file.type === "image/jpeg";
    const dataUrl = canvas.toDataURL(
      preferJpeg ? "image/jpeg" : "image/webp",
      0.85
    );
    return { dataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function scaledSize(w: number, h: number): { width: number; height: number } {
  if (w <= MAX_DIM && h <= MAX_DIM) return { width: w, height: h };
  const ratio = w > h ? MAX_DIM / w : MAX_DIM / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = src;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.readAsDataURL(file);
  });
}
