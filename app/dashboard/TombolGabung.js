"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gabungKelas } from "./absensi/actions";

// Membuka tautan kelas di tab baru; bersamaan itu kehadiran dicatat otomatis (bila sedang jam kelas).
export default function TombolGabung({ link, pesanAwal }) {
  const router = useRouter();
  const [pesan, setPesan] = useState(pesanAwal || "");
  useEffect(() => {
    const kembali = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", kembali);
    return () => document.removeEventListener("visibilitychange", kembali);
  }, [router]);
  return (
    <div className="space-y-2">
      <a href={link} target="_blank" rel="noopener noreferrer" className="btn-kuning w-full !min-h-[60px] text-lg"
        onClick={() => { gabungKelas().then((r) => { if (r?.tercatat) setPesan("✓ Kehadiran Anda tercatat otomatis: Hadir."); }); }}>
        Gabung Kelas
      </a>
      {pesan && <p className="rounded-2xl bg-white/15 px-4 py-2 text-sm" role="status">{pesan}</p>}
    </div>
  );
}
