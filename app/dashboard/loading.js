// Tampil seketika saat berpindah halaman, sementara data dimuat.
export default function Memuat() {
  return (
    <div role="status" aria-live="polite" className="space-y-4" aria-busy="true">
      <span className="sr-only">Memuat…</span>
      <div className="h-8 w-2/3 max-w-sm animate-pulse rounded-xl bg-hijau-muda" />
      <div className="h-28 animate-pulse rounded-kartu bg-white shadow-sm ring-1 ring-hijau/10" />
      <div className="h-28 animate-pulse rounded-kartu bg-white shadow-sm ring-1 ring-hijau/10" />
      <div className="h-20 animate-pulse rounded-kartu bg-white shadow-sm ring-1 ring-hijau/10" />
    </div>
  );
}
