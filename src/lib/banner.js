// Menyesuaikan gambar apa pun menjadi banner 1600x600 (rasio 8:3) langsung di browser,
// lalu mengompres ke WebP/JPEG di bawah batas ukuran. Pengguna tidak perlu mencari foto yang pas.

export const BANNER_W = 1600;
export const BANNER_H = 600;
export const MAKS_BYTE = 2 * 1024 * 1024; // sama dengan batas di server
export const MIN_SISI = 400; // di bawah ini gambar terlalu kecil untuk layak dipakai

function muat(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File bukan gambar yang valid. Gunakan JPG, PNG, atau WebP."));
    };
    img.src = url;
  });
}

const kePotongan = (canvas, tipe, mutu) => new Promise((res) => canvas.toBlob(res, tipe, mutu));

/**
 * mode "potong": gambar memenuhi banner, bagian lebih dipotong
 * mode "utuh":   seluruh gambar terlihat di tengah, sisanya latar buram dari gambar yang sama
 * mode "auto":   potong jika rasio gambar >= 2:1, selain itu utuh
 */
export async function siapkanBanner(file, { mode = "auto", fokusX = 0.5, fokusY = 0.5 } = {}) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Format gambar harus JPG, PNG, atau WebP.");
  }

  const { img, url } = await muat(file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (Math.min(w, h) < MIN_SISI) {
      throw new Error(`Gambar terlalu kecil (${w}×${h} px). Gunakan gambar dengan sisi terpendek minimal ${MIN_SISI} px.`);
    }

    const pakai = mode === "auto" ? (w / h >= 2 ? "potong" : "utuh") : mode;
    const canvas = document.createElement("canvas");
    canvas.width = BANNER_W;
    canvas.height = BANNER_H;
    const c = canvas.getContext("2d");
    c.imageSmoothingQuality = "high";

    if (pakai === "potong") {
      const skala = Math.max(BANNER_W / w, BANNER_H / h);
      const sw = BANNER_W / skala;
      const sh = BANNER_H / skala;
      const sx = Math.min(Math.max((w - sw) * fokusX, 0), w - sw);
      const sy = Math.min(Math.max((h - sh) * fokusY, 0), h - sh);
      c.drawImage(img, sx, sy, sw, sh, 0, 0, BANNER_W, BANNER_H);
    } else {
      // Latar: gambar yang sama diperbesar lalu diburamkan
      const skala = Math.max(BANNER_W / w, BANNER_H / h);
      c.filter = "blur(28px) brightness(0.92)";
      const bw = w * skala * 1.08;
      const bh = h * skala * 1.08;
      c.drawImage(img, (BANNER_W - bw) / 2, (BANNER_H - bh) / 2, bw, bh);
      c.filter = "none";
      // Gambar utuh di tengah
      const s = Math.min(BANNER_W / w, BANNER_H / h);
      const dw = w * s;
      const dh = h * s;
      c.drawImage(img, (BANNER_W - dw) / 2, (BANNER_H - dh) / 2, dw, dh);
    }

    // Kompres sampai muat di batas ukuran
    let blob = null;
    let tipe = "image/webp";
    for (const mutu of [0.9, 0.82, 0.72, 0.6, 0.5]) {
      blob = await kePotongan(canvas, tipe, mutu);
      if (!blob || blob.type !== "image/webp") {
        tipe = "image/jpeg"; // browser tanpa dukungan WebP
        blob = await kePotongan(canvas, tipe, mutu);
      }
      if (blob && blob.size <= MAKS_BYTE) break;
    }
    if (!blob || blob.size > MAKS_BYTE) throw new Error("Gambar tidak dapat dikompres sampai di bawah 2 MB. Coba gambar lain.");

    const ekstensi = tipe === "image/webp" ? "webp" : "jpg";
    const nama = file.name.replace(/\.[^.]+$/, "") + "." + ekstensi;
    const hasil = new File([blob], nama, { type: tipe });

    return {
      file: hasil,
      previewUrl: URL.createObjectURL(hasil),
      info: { asliW: w, asliH: h, mode: pakai, kecil: pakai === "potong" && (w < BANNER_W || h < BANNER_H) },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}