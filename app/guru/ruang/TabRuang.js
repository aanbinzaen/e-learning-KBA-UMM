"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabRuang() {
  const p = usePathname();
  const tab = [["/guru/ruang", "Perpustakaan", !p.startsWith("/guru/ruang/diskusi")], ["/guru/ruang/diskusi", "Diskusi", p.startsWith("/guru/ruang/diskusi")]];
  return (
    <nav className="flex gap-2" aria-label="Ruang Pengajar">
      {tab.map(([h, l, aktif]) => (
        <Link key={h} href={h} aria-current={aktif ? "page" : undefined}
          className={`rounded-2xl px-5 py-2.5 text-sm font-semibold ${aktif ? "bg-hijau text-white" : "border-2 border-hijau/20 bg-white text-hijau hover:bg-hijau-muda"}`}>{l}</Link>
      ))}
    </nav>
  );
}
