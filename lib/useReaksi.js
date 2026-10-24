"use client";
import { useEffect } from "react";
import { reaksi, jenisHasil } from "@/lib/reaksi";

// Memanggil getar/bunyi setiap kali hasil formulir (state) berubah menjadi berhasil atau gagal.
export function useReaksiHasil(state) {
  useEffect(() => { const j = jenisHasil(state); if (j) reaksi(j); }, [state]);
}
