/* eslint-disable @next/next/no-img-element */
export default function Avatar({ nama, src, ukuran = 96 }) {
  const inisial = nama.replace(/^(Ustadzah?|Syaikh|Dr\.?|KH)\s+/i, "").split(/[\s,]+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  if (src) return <img src={src} alt={nama} width={ukuran} height={ukuran} loading="lazy" className="rounded-full object-cover" style={{ width: ukuran, height: ukuran }} />;
  return (
    <span aria-hidden className="flex items-center justify-center rounded-full bg-hijau-muda font-bold text-hijau" style={{ width: ukuran, height: ukuran, fontSize: ukuran / 3 }}>{inisial}</span>
  );
}
