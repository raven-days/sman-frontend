export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton rounded-lg ${className}`} />;
}

// Kerangka kartu pengumuman saat data dimuat.
export function DaftarKartuSkeleton({ n = 3, className = "md:grid-cols-3" }) {
  return (
    <div role="status" className={`mt-8 grid gap-5 ${className}`}>
      <span className="sr-only">Memuat data...</span>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line bg-white">
          <Skeleton className="h-44 rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Kerangka baris untuk daftar/tabel.
export function DaftarBarisSkeleton({ n = 5, className = "" }) {
  return (
    <div role="status" className={`space-y-3 ${className}`}>
      <span className="sr-only">Memuat data...</span>
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}