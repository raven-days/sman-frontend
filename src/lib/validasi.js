// Ubah error validasi Laravel ({ kolom: ["pesan"] }) menjadi { kolom: "pesan" }.
// `peta` dipakai bila nama kolom di server berbeda dengan nama di formulir.
export const galatPerKolom = (errors, peta = {}) =>
  Object.fromEntries(
    Object.entries(errors || {}).map(([k, v]) => [peta[k] || k, Array.isArray(v) ? v[0] : String(v)])
  );

// Pindahkan fokus ke isian pertama yang salah (menunggu React selesai menggambar ulang).
export const fokusSalah = (root) =>
  requestAnimationFrame(() => root?.querySelector('[aria-invalid="true"]')?.focus());