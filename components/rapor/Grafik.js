// Bagan sederhana (SVG/CSS) untuk rapor dan laporan di layar. Tanpa pustaka tambahan, aman dipakai di komponen server.
export const TRACK = "#E3E8DC";

export function Cincin({ nilai = 0, warna = "#1E7B34", ukuran = 168, tebal = 14, isi, sub }) {
  const r = 50, k = 2 * Math.PI * r, p = Math.max(0, Math.min(100, nilai));
  return (
    <div className="relative shrink-0" style={{ width: ukuran, height: ukuran }}>
      <svg viewBox="0 0 120 120" width={ukuran} height={ukuran} role="img" aria-label={`${isi ?? nilai}`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke={TRACK} strokeWidth={tebal} />
        <circle cx="60" cy="60" r={r} fill="none" stroke={warna} strokeWidth={tebal} strokeLinecap="round" strokeDasharray={`${(p / 100) * k} ${k}`} transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold leading-none text-hijau-tua">{isi ?? nilai}</span>
        {sub && <span className="mt-1 text-xs font-medium tracking-wide text-tinta/60">{sub}</span>}
      </div>
    </div>
  );
}

// bagian: [{ nilai, warna, label }]
export function Donut({ bagian, ukuran = 168, tebal = 22, tengah, sub }) {
  const r = 48, k = 2 * Math.PI * r, total = bagian.reduce((a, b) => a + b.nilai, 0);
  let awal = 0;
  return (
    <div className="relative shrink-0" style={{ width: ukuran, height: ukuran }}>
      <svg viewBox="0 0 120 120" width={ukuran} height={ukuran} role="img" aria-label="Diagram lingkaran">
        <circle cx="60" cy="60" r={r} fill="none" stroke={TRACK} strokeWidth={tebal} />
        {total > 0 && bagian.filter((b) => b.nilai > 0).map((b, i) => {
          const panjang = (b.nilai / total) * k, el = <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={b.warna} strokeWidth={tebal} strokeDasharray={`${Math.max(0, panjang - 0.8)} ${k}`} strokeDashoffset={-awal} transform="rotate(-90 60 60)" />;
          awal += panjang; return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold leading-none text-hijau-tua">{tengah}</span>
        {sub && <span className="mt-1 text-xs font-medium text-tinta/60">{sub}</span>}
      </div>
    </div>
  );
}

export function BatangH({ nilai = 0, warna = "#1E7B34", tinggi = 12, label }) {
  const p = Math.max(0, Math.min(100, nilai));
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ height: tinggi, background: TRACK }} role="img" aria-label={label ?? `${p}%`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, minWidth: p > 0 ? tinggi : 0, background: warna }} />
    </div>
  );
}

export function Lencana({ predikat }) {
  return <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: predikat.warna }}>{predikat.nama}</span>;
}
