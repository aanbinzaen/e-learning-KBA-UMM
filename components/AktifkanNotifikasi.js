"use client";
import { useEffect, useState } from "react";

const DAFTAR = [["kelas", "Kelas dan absensi"], ["kuis", "Kuis dan nilai"], ["pengumuman", "Pengumuman"], ["jadwal", "Jadwal"], ["faidah", "Faidah ilmu"]];
const KUNCI_TOPIK = "kbumm-topik-notif";

function kunciKeBytes(b64) {
  const p = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...bin].map((c) => c.charCodeAt(0)));
}
const kirim = (url, data) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json().then((j) => ({ ok: r.ok, ...j })));

const Kotak = ({ children }) => <section className="kartu space-y-3"><h2 className="text-lg font-semibold text-hijau">Notifikasi di HP</h2>{children}</section>;

export default function AktifkanNotifikasi() {
  const [status, setStatus] = useState("memeriksa"); // memeriksa | tidak | ios | siap
  const [aktif, setAktif] = useState(false);
  const [izin, setIzin] = useState("default");
  const [topik, setTopik] = useState(DAFTAR.map(([k]) => k));
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null);

  useEffect(() => {
    (async () => {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const terpasang = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
      const didukung = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!didukung) return setStatus(iOS && !terpasang ? "ios" : "tidak");
      try {
        const simpan = JSON.parse(localStorage.getItem(KUNCI_TOPIK) || "null");
        const t = Array.isArray(simpan) ? simpan : DAFTAR.map(([k]) => k);
        setTopik(t); setIzin(Notification.permission);
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setAktif(!!sub); setStatus("siap");
        // hubungkan ulang perangkat ke akun yang sedang masuk (bila ganti akun di perangkat yang sama)
        if (sub) kirim("/api/push/langgan", { langganan: sub.toJSON(), topik: t }).catch(() => {});
      } catch { setStatus("tidak"); }
    })();
  }, []);

  async function aktifkan() {
    setSibuk(true); setPesan(null);
    try {
      const hasil = await Notification.requestPermission();
      setIzin(hasil);
      if (hasil !== "granted") { setPesan({ galat: "Izin notifikasi tidak diberikan. Buka pengaturan situs di peramban Anda, ubah Notifikasi menjadi Izinkan, lalu coba lagi." }); setSibuk(false); return; }
      const k = await fetch("/api/push/kunci").then((r) => r.json());
      if (!k.publik) throw new Error(k.galat || "Kunci tidak tersedia");
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: kunciKeBytes(k.publik) }));
      const r = await kirim("/api/push/langgan", { langganan: sub.toJSON(), topik });
      if (!r.ok) throw new Error(r.galat || "Gagal menyimpan");
      setAktif(true); setPesan({ ok: "Notifikasi aktif di perangkat ini. Coba tombol Kirim notifikasi uji." });
    } catch (e) { setPesan({ galat: e.message || "Notifikasi gagal diaktifkan. Coba lagi." }); }
    setSibuk(false);
  }

  async function simpanTopik(baru) {
    setTopik(baru);
    try { localStorage.setItem(KUNCI_TOPIK, JSON.stringify(baru)); } catch { /* diabaikan */ }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) kirim("/api/push/langgan", { langganan: sub.toJSON(), topik: baru }).catch(() => {});
  }
  const ubahTopik = (k) => simpanTopik(topik.includes(k) ? topik.filter((x) => x !== k) : [...topik, k]);

  async function matikan() {
    setSibuk(true); setPesan(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await kirim("/api/push/berhenti", { endpoint: sub.endpoint }); await sub.unsubscribe(); }
      setAktif(false); setPesan({ ok: "Notifikasi dimatikan di perangkat ini." });
    } catch { setPesan({ galat: "Gagal mematikan notifikasi." }); }
    setSibuk(false);
  }

  async function uji() {
    setSibuk(true); setPesan(null);
    try {
      const r = await kirim("/api/push/uji", {});
      setPesan(r.terkirim > 0 ? { ok: "Notifikasi uji dikirim. Lihat bilah notifikasi HP Anda." } : { galat: r.tertunda ? "Pengiriman tertunda. Coba lagi sebentar." : "Notifikasi belum terkirim. Matikan lalu aktifkan kembali." });
    } catch { setPesan({ galat: "Gagal mengirim uji." }); }
    setSibuk(false);
  }

  if (status === "memeriksa") return null;

  if (status === "ios") return (
    <Kotak>
      <p className="text-sm leading-relaxed">Di iPhone/iPad, notifikasi hanya bisa diterima bila situs dipasang di layar utama:</p>
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed"><li>Buka situs ini di <b>Safari</b>.</li><li>Ketuk tombol <b>Bagikan</b> lalu <b>Tambah ke Layar Utama</b>.</li><li>Buka situs dari <b>ikon di layar utama</b>, lalu aktifkan notifikasi di sini.</li></ol>
    </Kotak>
  );
  if (status === "tidak") return <Kotak><p className="text-sm leading-relaxed text-tinta/70">Peramban ini belum mendukung notifikasi. Gunakan Chrome atau Firefox (Android/komputer), atau Safari di iPhone dengan iOS 16.4 ke atas.</p></Kotak>;

  return (
    <Kotak>
      {!aktif ? (
        <>
          <p className="text-sm leading-relaxed">Dapatkan pemberitahuan di HP saat ada <b>kelas, absensi, kuis, pengumuman, jadwal, atau faidah baru</b>, walau situs tidak sedang dibuka.</p>
          <button type="button" onClick={aktifkan} disabled={sibuk || izin === "denied"} className="btn-kuning w-full disabled:opacity-60">{sibuk ? "Mengaktifkan…" : "Aktifkan notifikasi"}</button>
          {izin === "denied" && <p className="text-sm text-red-700">Notifikasi diblokir di peramban ini. Buka pengaturan situs, ubah Notifikasi menjadi Izinkan, lalu muat ulang halaman.</p>}
        </>
      ) : (
        <>
          <p className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm font-medium text-hijau-tua">Notifikasi aktif di perangkat ini.</p>
          <fieldset className="space-y-2"><legend className="mb-1 text-sm font-semibold">Terima notifikasi tentang:</legend>
            {DAFTAR.map(([k, l]) => (
              <label key={k} className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" checked={topik.includes(k)} onChange={() => ubahTopik(k)} className="h-6 w-6 accent-[#1E7B34]" />{l}</label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={uji} disabled={sibuk} className="btn-hijau !min-h-[44px] !px-5 text-sm disabled:opacity-60">Kirim notifikasi uji</button>
            <button type="button" onClick={matikan} disabled={sibuk} className="btn-garis !min-h-[44px] !border-red-300 !px-5 text-sm !text-red-700 disabled:opacity-60">Matikan</button>
          </div>
        </>
      )}
      {pesan?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{pesan.ok}</p>}
      {pesan?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan.galat}</p>}
    </Kotak>
  );
}
