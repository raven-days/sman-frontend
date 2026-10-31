const TZ = "Asia/Jakarta";

export function nowLabel() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TZ,
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value])
  );
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}`;
}

// "2026-11-05" -> "5 Nov 2026"
export function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

// "Siswa Demo" -> "S*** D***"
export function maskName(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0] + "***")
    .join(" ");
}
