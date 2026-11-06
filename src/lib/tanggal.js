// "2026-11-05" -> "5 November 2026". Teks lain (data demo) dikembalikan apa adanya.
export function tgl(v) {
  if (!v) return "";
  if (!/^\d{4}-\d{2}-\d{2}/.test(v)) return v;
  return new Date(v.slice(0, 10) + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}