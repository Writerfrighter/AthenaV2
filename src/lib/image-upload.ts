/**
 * Turn a picked image file into a JPEG data URL small enough to store.
 * The aspect ratio is kept. The longest side starts at `longestSide` and keeps
 * shrinking until the result fits in `maxLength` characters, so a large image
 * is scaled down rather than refused. Only a file that is not an image throws,
 * with a message that can be shown to the user.
 */
export async function imageFileToDataUrl(
  file: File,
  longestSide: number,
  maxLength: number,
): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file could not be read as an image.");
  }
  for (let longest = longestSide; longest >= 16; longest *= 0.75) {
    const scale = Math.min(1, longest / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (dataUrl.length <= maxLength) return dataUrl;
  }
  throw new Error("That file could not be read as an image.");
}
