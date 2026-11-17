import { API_URL } from "./api";

// Alamat foto dari server bersifat relatif (mis. /api/fasilitas/foto/1/kecil). Jadikan alamat lengkap.
export function fotoSrc(rel) {
  if (!rel) return "";
  try {
    return new URL(rel, new URL(API_URL).origin).href;
  } catch {
    return rel;
  }
}

// Perkecil foto di browser sebelum diunggah: sisi terpanjang 1600 px, JPEG kualitas 0,82.
// Jika gagal (browser lama), foto asli yang dikirim.
export async function kecilkanFoto(file, maks = 1600, kualitas = 0.82) {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file); // arah foto (EXIF) otomatis dibetulkan browser
    const skala = Math.min(1, maks / Math.max(bmp.width, bmp.height));
    const lebar = Math.round(bmp.width * skala);
    const tinggi = Math.round(bmp.height * skala);

    const kanvas = document.createElement("canvas");
    kanvas.width = lebar;
    kanvas.height = tinggi;
    const ctx = kanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lebar, tinggi);
    ctx.drawImage(bmp, 0, 0, lebar, tinggi);
    if (bmp.close) bmp.close();

    const blob = await new Promise((res) => kanvas.toBlob(res, "image/jpeg", kualitas));
    if (!blob || (skala === 1 && blob.size >= file.size)) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}