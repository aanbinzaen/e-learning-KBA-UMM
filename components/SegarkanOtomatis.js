"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Memuat ulang data halaman secara berkala (obrolan terasa langsung) dan menggulir ke pesan terbaru.
export default function SegarkanOtomatis({ jumlah = 0, gulir = false, detik = 15 }) {
  const router = useRouter();
  const awal = useRef(true), sebelum = useRef(jumlah);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, detik * 1000);
    return () => clearInterval(t);
  }, [router, detik]);
  useEffect(() => {
    if (gulir && (awal.current || jumlah !== sebelum.current)) {
      document.getElementById("akhir-pesan")?.scrollIntoView({ behavior: awal.current ? "auto" : "smooth", block: "end" });
    }
    awal.current = false; sebelum.current = jumlah;
  }, [jumlah, gulir]);
  return null;
}
