"use client";
import { useEffect, useRef, useState } from "react";
import Ikon from "@/components/Ikon";

const SEMUA_TOPIK = ["kelas", "kuis", "pengumuman", "jadwal", "faidah"];
const KUNCI_TOPIK = "kbumm-topik-notif";

function kunciKeBytes(b64) {
  const p = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...bin].map((c) => c.charCodeAt(0)));
}
const kirim = (url, data) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json().then((j) => ({ ok: r.ok, ...j })));
const topikTersimpan = () => { try { const t = JSON.parse(localStorage.getItem(KUNCI_TOPIK) || "null"); return Array.isArray(t) ? t : SEMUA_TOPIK; } catch { return SEMUA_TOPIK; } };

// Lonceng di bilah atas: satu ketukan mengaktifkan notifikasi (semua topik) lalu langsung mengirim notifikasi uji.
// Titik kuning = belum aktif di HP ini. Setelah aktif, kabar dari admin tetap sampai walau situs tidak dibuka.
export default function LoncengNotifikasi() {
  const [aktif, setAktif] = useState(null); // null = memeriksa
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null);
  const pewaktu = useRef(null);

  const tampil = (p, ms = 5000) => { clearTimeout(pewaktu.current); setPesan(p); pewaktu.current = setTimeout(() => setPesan(null), ms); };

  useEffect(() => {
    (async () => {
      try {
        if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) return setAktif(false);
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setAktif(!!sub && Notification.permission === "granted");
        if (sub) kirim("/api/push/langgan", { langganan: sub.toJSON(), topik: topikTersimpan() }).catch(() => {}); // hubungkan ke akun yang sedang masuk
      } catch { setAktif(false); }
    })();
    return () => clearTimeout(pewaktu.current);
  }, []);

  async function aktifkan() {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const terpasang = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) {
      return tampil({ galat: iOS && !terpasang ? "Di iPhone: ketuk Bagikan lalu Tambah ke Layar Utama, buka situs dari ikon itu, lalu ketuk lonceng lagi." : "Peramban ini belum mendukung notifikasi. Gunakan Chrome." }, 9000);
    }
    setSibuk(true);
    try {
      const izin = await Notification.requestPermission();
      if (izin !== "granted") { setSibuk(false); return tampil({ galat: "Izin notifikasi belum diberikan. Buka pengaturan situs di peramban, ubah Notifikasi menjadi Izinkan, lalu ketuk lonceng lagi." }, 9000); }
      const k = await fetch("/api/push/kunci").then((r) => r.json());
      if (!k.publik) throw new Error(k.galat || "Kunci tidak tersedia");
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: kunciKeBytes(k.publik) }));
      const r = await kirim("/api/push/langgan", { langganan: sub.toJSON(), topik: topikTersimpan() });
      if (!r.ok) throw new Error(r.galat || "Gagal menyimpan");
      setAktif(true);
      const u = await kirim("/api/push/uji", {}).catch(() => ({}));
      tampil({ ok: u.terkirim > 0 ? "Notifikasi aktif ✓ Lihat bilah notifikasi HP Anda." : "Notifikasi aktif ✓" });
    } catch (e) { tampil({ galat: e.message || "Notifikasi gagal diaktifkan. Coba lagi." }, 8000); }
    setSibuk(false);
  }

  async function matikan() {
    setSibuk(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await kirim("/api/push/berhenti", { endpoint: sub.endpoint }); await sub.unsubscribe(); }
      setAktif(false); tampil({ ok: "Notifikasi dimatikan di HP ini." });
    } catch { tampil({ galat: "Gagal mematikan notifikasi." }); }
    setSibuk(false);
  }

  function ketuk() {
    if (sibuk) return;
    if (aktif) return tampil({ aktifInfo: true }, 6000);
    aktifkan();
  }

  return (
    <div className="shrink-0">
      <button type="button" onClick={ketuk} disabled={sibuk} aria-label={aktif ? "Notifikasi aktif" : "Aktifkan notifikasi"}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white disabled:opacity-60">
        <Ikon nama="lonceng" ukuran={22} />
        {aktif === false && <span aria-hidden className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-hijau bg-kuning" />}
        {aktif && <span aria-hidden className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-kuning text-[10px] font-bold text-hijau-tua">✓</span>}
      </button>
      {pesan && (
        <div role={pesan.galat ? "alert" : "status"} className={`fixed inset-x-4 top-[88px] z-40 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${pesan.galat ? "bg-red-50 text-red-800" : "bg-white text-hijau-tua"}`}>
          <span>{pesan.aktifInfo ? "Notifikasi sudah aktif di HP ini ✓" : pesan.ok || pesan.galat}</span>
          {pesan.aktifInfo && <button type="button" onClick={matikan} className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700">Matikan</button>}
        </div>
      )}
    </div>
  );
}
