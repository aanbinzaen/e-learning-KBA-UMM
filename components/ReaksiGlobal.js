"use client";
import { useEffect } from "react";
import { reaksi } from "@/lib/reaksi";

// Satu pendengar untuk seluruh situs: setiap tombol yang aktif memberi getar dan bunyi singkat saat ditekan.
export default function ReaksiGlobal() {
  useEffect(() => {
    const ketuk = (e) => {
      const el = e.target?.closest?.("button, a, summary, label, input[type='submit'], [role='button']");
      if (!el || el.disabled || el.getAttribute("aria-disabled") === "true" || el.closest("[data-diam]")) return;
      const tag = el.tagName;
      if ((tag === "A" || tag === "LABEL") && !/\bbtn/.test(el.className)) return; // tautan biasa tidak ikut
      reaksi("klik");
    };
    document.addEventListener("click", ketuk, { passive: true });
    return () => document.removeEventListener("click", ketuk);
  }, []);
  return null;
}
