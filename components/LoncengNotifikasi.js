"use client";
import { useEffect, useState } from "react";
import Ikon from "@/components/Ikon";
import AktifkanNotifikasi from "@/components/AktifkanNotifikasi";

// Lonceng di bilah atas: satu ketukan membuka pengaturan dan langsung meminta izin notifikasi.
// Titik kuning = notifikasi belum aktif di HP ini. Setelah aktif, notifikasi dari admin tetap sampai walau situs tidak dibuka.
export default function LoncengNotifikasi() {
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(null); // null = memeriksa
  const [ketukan, setKetukan] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) return setAktif(false);
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setAktif(!!sub && Notification.permission === "granted");
      } catch { setAktif(false); }
    })();
  }, [buka]);

  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => { setBuka(!buka); setKetukan((n) => n + 1); }} aria-expanded={buka} aria-label={aktif ? "Notifikasi aktif. Buka pengaturan notifikasi" : "Aktifkan notifikasi"}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border ${buka ? "border-white bg-white text-hijau" : "border-white/40 bg-white/15 text-white"}`}>
        <Ikon nama="lonceng" ukuran={22} />
        {aktif === false && <span aria-hidden className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-hijau bg-kuning" />}
      </button>
      {buka && (
        <div className="fixed inset-x-4 top-[88px] z-40 mx-auto max-w-md text-tinta shadow-xl" role="dialog" aria-label="Pengaturan notifikasi">
          <AktifkanNotifikasi key={ketukan} mulaiOtomatis tanpaJudul />
        </div>
      )}
    </div>
  );
}
