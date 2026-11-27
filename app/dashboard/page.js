import Link from "next/link";
import { ambilSesi } from "@/lib/auth";
import AktifkanNotifikasi from "@/components/AktifkanNotifikasi";
import { tanggalIndo, tanggalPendek, ambilPengumuman } from "@/lib/data";
import TombolGabung from "./TombolGabung";
import TombolAbsen from "./absensi/TombolAbsen";
import PanelAksi from "@/components/PanelAksi";
import Ikon from "@/components/Ikon";

export default async function Dashboard() {
  const { supabase, user, profil: p } = await ambilSesi();
  const peran = { peserta: "Peserta", pengajar: "Pengajar", admin: "Admin" }[p?.role] || "Peserta";

  const { data: pg } = await supabase.from("peserta_grup")
    .select("grup(id,nama,kelas(jenis_kelamin,tingkat),pengajar(nama))").eq("profile_id", user.id).maybeSingle();
  const grup = pg?.grup;
  let tautan = null, teman = [], persen = 0, total = 0, selesai = 0, absenBuka = 0;
  let daftarPertemuan = [], absensiSaya = {}, kuisDaftar = [], nilaiKuis = {}, rekamanBaru = [];
  if (grup) {
    const hitung = (t) => supabase.from(t).select("id", { count: "exact", head: true }).eq("grup_id", grup.id);
    const [m, r, k, s, ab, tt, tm, hd, pt, absAll, ku, pc, rk] = await Promise.all([
      supabase.from("materi").select("id,pertemuan_id").eq("grup_id", grup.id), supabase.from("rekaman").select("id,pertemuan_id,mulai_detik,selesai_detik,video_path").eq("grup_id", grup.id), hitung("kuis").eq("diterbitkan", true),
      supabase.from("progres").select("item_id,jenis").eq("profile_id", user.id).in("jenis", ["materi", "rekaman", "kuis"]),
      supabase.from("pertemuan").select("id", { count: "exact", head: true }).eq("grup_id", grup.id).eq("absensi_buka", true),
      supabase.from("grup_tautan").select("link").eq("grup_id", grup.id).maybeSingle(),
      supabase.rpc("teman_grup"),
      supabase.from("absensi").select("pertemuan_id").eq("profile_id", user.id).eq("status", "hadir"),
      supabase.from("pertemuan").select("id,judul,waktu,absensi_buka").eq("grup_id", grup.id).order("waktu", { ascending: false }).limit(12),
      supabase.from("absensi").select("pertemuan_id,status,dicatat_oleh").eq("profile_id", user.id),
      supabase.from("kuis").select("id,judul").eq("grup_id", grup.id).eq("diterbitkan", true).order("dibuat_pada", { ascending: false }).limit(4),
      supabase.from("percobaan").select("kuis_id,nilai").eq("profile_id", user.id),
      supabase.from("rekaman").select("id,judul,youtube_id,video_path,pertemuan_id,mulai_detik,selesai_detik").eq("grup_id", grup.id).order("dibuat_pada", { ascending: false }).limit(5),
    ]);
    daftarPertemuan = pt.data || [];
    absensiSaya = Object.fromEntries((absAll.data || []).map((a) => [a.pertemuan_id, a]));
    kuisDaftar = ku.data || [];
    (pc.data || []).forEach((x) => { if (x.nilai != null) nilaiKuis[x.kuis_id] = Math.max(nilaiKuis[x.kuis_id] ?? 0, x.nilai); else nilaiKuis[x.kuis_id] ??= null; });
    rekamanBaru = rk.data || [];
    absenBuka = ab.count || 0;
    // hadir langsung = materi & rekaman pertemuan itu otomatis selesai
    const hadirDi = new Set((hd.data || []).map((x) => x.pertemuan_id)), tandai = new Set((s.data || []).map((x) => x.item_id));
    const bahan = [...(m.data || []), ...(r.data || []).filter((x) => x.mulai_detik == null && x.selesai_detik == null && !x.video_path)]; // klip kajian tidak dihitung
    const selesaiBahan = bahan.filter((x) => tandai.has(x.id) || hadirDi.has(x.pertemuan_id)).length;
    const selesaiKuis = (s.data || []).filter((x) => x.jenis === "kuis").length;
    total = bahan.length + (k.count || 0); selesai = Math.min(selesaiBahan + selesaiKuis, total);
    persen = total ? Math.round((selesai / total) * 100) : 0;
    tautan = tt.data?.link;
    teman = tm.data || [];
  }

  // pertemuan yang sedang berlangsung (30 menit sebelum s.d. 3 jam sesudah mulai) atau yang berikutnya
  const kini = Date.now();
  const berlangsung = daftarPertemuan.find((x) => { const t = new Date(x.waktu).getTime(); return t >= kini - 3 * 3600e3 && t <= kini + 30 * 60e3; });
  const berikutnya = [...daftarPertemuan].filter((x) => new Date(x.waktu).getTime() > kini).sort((a, b) => new Date(a.waktu) - new Date(b.waktu))[0];
  const fokus = berlangsung || berikutnya;
  const absenDibuka = daftarPertemuan.filter((x) => x.absensi_buka);
  const statusFokus = fokus ? absensiSaya[fokus.id] : null;

  const pengumuman = p?.role === "peserta" ? await ambilPengumuman(3) : [];
  const kuisBelum = kuisDaftar.filter((q) => !(q.id in nilaiKuis)).length;
  const panelKuis = (
    <div>
      {kuisDaftar.length ? (
        <ul className="divide-y divide-hijau/10">
          {kuisDaftar.map((q) => (
            <li key={q.id}><Link href={`/dashboard/kuis/${q.id}`} className="flex items-center justify-between gap-3 py-2.5">
              <span className="font-medium leading-snug">{q.judul}</span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${q.id in nilaiKuis ? "bg-hijau-muda text-hijau-tua" : "bg-kuning/40 text-hijau-tua"}`}>{q.id in nilaiKuis ? (nilaiKuis[q.id] != null ? `Nilai ${nilaiKuis[q.id]}` : "Menunggu nilai") : "Kerjakan"}</span>
            </Link></li>
          ))}
        </ul>
      ) : <p className="text-sm text-tinta/60">Belum ada kuis yang terbit.</p>}
      <Link href="/dashboard/kelas" className="mt-2 block text-sm font-medium text-hijau underline">Semua kuis di halaman Kelas</Link>
    </div>
  );
  const panelRekaman = (
    <div>
      {rekamanBaru.length ? (
        <ul className="space-y-2.5">
          {rekamanBaru.map((rk) => (
            <li key={rk.id}><Link href={`/dashboard/kelas/${rk.pertemuan_id}`} className="flex items-center gap-3">
              {rk.video_path
                ? <span aria-hidden className="flex h-[54px] w-24 shrink-0 items-center justify-center rounded-xl bg-hijau text-white"><Ikon nama="rekaman" ukuran={26} /></span>
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={`https://i.ytimg.com/vi/${rk.youtube_id}/mqdefault.jpg`} alt="" width="96" height="54" loading="lazy" className="h-[54px] w-24 shrink-0 rounded-xl bg-hijau-muda object-cover" />}
              <span className="text-sm font-medium leading-snug">{rk.judul}{(rk.mulai_detik != null || rk.selesai_detik != null) && <span className="ml-1.5 rounded-full bg-kuning/30 px-2 py-0.5 text-[11px] font-semibold text-hijau-tua">Klip</span>}{rk.video_path && <span className="ml-1.5 rounded-full bg-kuning/30 px-2 py-0.5 text-[11px] font-semibold text-hijau-tua">Video pendek</span>}</span>
            </Link></li>
          ))}
        </ul>
      ) : <p className="text-sm text-tinta/60">Belum ada rekaman.</p>}
      <Link href="/dashboard/kelas" className="mt-2 block text-sm font-medium text-hijau underline">Semua rekaman di halaman Kelas</Link>
    </div>
  );
  const panelPengumuman = (
    <div className="space-y-2.5">
      {pengumuman.length ? pengumuman.map((x) => (
        <div key={x.id} className="relative overflow-hidden rounded-2xl bg-hijau-muda/60 p-3 pl-4">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-kuning to-jingga" />
          <p className="font-semibold leading-snug text-hijau-tua">{x.judul}</p>
          {x.dibuat_pada && <p className="text-xs text-tinta/60">{tanggalPendek(x.dibuat_pada)}</p>}
          <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-sm" dir="auto">{x.isi}</p>
        </div>
      )) : <p className="text-sm text-tinta/60">Belum ada pengumuman.</p>}
      <Link href="/#pengumuman" className="block text-sm font-medium text-hijau underline">Lihat semua di beranda situs</Link>
    </div>
  );
  const itemPeserta = [
    { id: "absen", ikon: "absen", label: "Absen", href: "/dashboard/absensi", lencana: absenDibuka.length ? "!" : null, sorot: absenDibuka.length > 0 },
    { id: "kuis", ikon: "kuis", label: "Kuis", judul: "Kuis", lencana: kuisBelum || null, isi: panelKuis },
    { id: "rekaman", ikon: "rekaman", label: "Rekaman", judul: "Rekaman & Video Pendek", isi: panelRekaman },
    { id: "pengumuman", ikon: "pengumuman", label: "Pengumuman", judul: "Pengumuman", lencana: pengumuman.length || null, isi: panelPengumuman },
    { id: "materi", ikon: "materi", label: "Materi", href: "/dashboard/kelas" },
    { id: "rapor", ikon: "rapor", label: "Rapor", href: "/dashboard/rapor" },
  ];

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between gap-3 rounded-kartu bg-hijau px-4 py-3 text-white">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-snug">Assalamu'alaikum, {p?.nama_lengkap}</h1>
          <p className="truncate text-xs text-white/85">{peran} · Kode {p?.kode}{grup ? ` · ${grup.nama}` : ""}</p>
        </div>
        <span className="arab shrink-0 text-xl text-kuning" lang="ar" aria-hidden>السلام عليكم</span>
      </section>

      {grup ? (
        <>
          <section className="space-y-3 rounded-kartu border-2 border-hijau/20 bg-white p-4">
            <div>
              <p className="text-xs font-medium text-hijau">{berlangsung ? "Kelas sedang berlangsung" : fokus ? "Kelas berikutnya" : "Kelas saya"}</p>
              <h2 className="text-lg font-bold leading-snug text-hijau-tua">{fokus ? fokus.judul : `${grup.kelas?.jenis_kelamin} · ${grup.kelas?.tingkat}`}</h2>
              <p className="text-sm text-tinta/75">{fokus ? tanggalIndo(fokus.waktu) : "Belum ada jadwal pertemuan."} · {grup.pengajar?.nama || "pengajar belum ditentukan"}</p>
            </div>
            {tautan ? <TombolGabung link={tautan} pesanAwal={berlangsung && statusFokus?.status === "hadir" ? `✓ Kehadiran Anda tercatat: Hadir${statusFokus.dicatat_oleh === "peserta" ? "" : " (oleh pengajar)"}.` : ""} />
                    : <p className="rounded-2xl bg-hijau-muda p-3 text-sm">Link kelas belum diisi pengajar atau admin.</p>}
            <p className="text-xs text-tinta/65">Tekan <b>Gabung Kelas</b> pada jam kelas untuk otomatis tercatat <b>Hadir</b>.</p>
          </section>

          {p?.role === "peserta" && absenDibuka.map((x) => (
            <section key={x.id} className="rounded-kartu bg-kuning/90 p-4 text-hijau-tua">
              <p className="text-xs font-semibold">Absen mandiri dibuka</p>
              <h2 className="font-bold leading-snug">{x.judul}</h2>
              <div className="mt-2 rounded-2xl bg-hijau p-3 text-white"><TombolAbsen pertemuanId={x.id} awal={absensiSaya[x.id]?.status || null} dikunci={absensiSaya[x.id]?.dicatat_oleh === "pengajar"} /></div>
            </section>
          ))}
          {p?.role === "peserta" && !absenDibuka.length && berlangsung && statusFokus?.status !== "hadir" && (
            <p className="rounded-kartu bg-yellow-50 p-3 text-sm text-yellow-900">Anda belum tercatat hadir. Jika tidak masuk lewat Gabung Kelas, tunggu pengajar membuka absensi lalu isi absen mandiri di sini.</p>
          )}

          {p?.role === "peserta" && <PanelAksi item={itemPeserta} kolom={3} />}
        </>
      ) : (
        <section className="kartu space-y-3">
          {p?.role === "peserta" ? <p className="text-sm">Anda belum ditempatkan di grup. Hubungi admin.</p> : (
            <>
              <p className="text-sm">Anda dapat membuka dan mengelola kelas dari menu berikut.</p>
              <Link href="/guru" className="btn-hijau w-full">Kelola Kelas</Link>
              <Link href="/dashboard/kelas" className="btn-garis !border-hijau !text-hijau w-full">Lihat Kelas (tampilan peserta)</Link>
              {p?.role === "admin" && <Link href="/admin" className="btn-kuning w-full">Menu Admin</Link>}
            </>
          )}
        </section>
      )}

      {grup && (
        <section className="kartu !p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-hijau">Progres belajar</h2>
            <span className="text-sm font-bold text-hijau-tua">{persen}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-hijau-muda" role="progressbar" aria-valuenow={persen} aria-valuemin="0" aria-valuemax="100" aria-label="Progres belajar">
            <div className="h-full rounded-full bg-hijau" style={{ width: `${persen}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-tinta/70">{selesai} dari {total} materi, rekaman, dan kuis selesai</p>
        </section>
      )}
      {grup && (
        <details className="kartu !p-4">
          <summary className="cursor-pointer text-base font-semibold text-hijau">Teman satu grup ({teman.length})</summary>
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{teman.map((t) => <li key={t.nama_lengkap} className="py-1">{t.nama_lengkap}</li>)}</ul>
        </details>
      )}
      <AktifkanNotifikasi />
    </div>
  );
}
