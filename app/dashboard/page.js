import Link from "next/link";
import { ambilSesi } from "@/lib/auth";
import AktifkanNotifikasi from "@/components/AktifkanNotifikasi";
import { tanggalIndo, tanggalPendek, ambilPengumuman } from "@/lib/data";
import TombolGabung from "./TombolGabung";
import TombolAbsen from "./absensi/TombolAbsen";

function Ubin({ href, ikon, judul, ket, lencana, menonjol = false }) {
  return (
    <Link href={href} className={`relative flex min-h-[112px] flex-col justify-between rounded-kartu border-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md ${menonjol ? "border-kuning bg-kuning/25" : "border-hijau/15 bg-white"}`}>
      <span className="text-3xl" aria-hidden>{ikon}</span>
      <span>
        <span className="block font-bold leading-tight text-hijau-tua">{judul}</span>
        {ket && <span className="mt-0.5 block text-xs leading-snug text-tinta/70">{ket}</span>}
      </span>
      {lencana ? <span className="absolute right-3 top-3 rounded-full bg-hijau px-2.5 py-0.5 text-xs font-bold text-white">{lencana}</span> : null}
    </Link>
  );
}

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
  return (
    <div className="space-y-5">
      <section className="rounded-kartu bg-hijau p-6 text-white">
        <p className="arab text-right text-2xl text-kuning" lang="ar">السلام عليكم</p>
        <h1 className="text-xl font-bold leading-snug">Assalamu'alaikum, {p?.nama_lengkap}</h1>
        <p className="mt-1 text-sm text-white/90">{peran} · Kode {p?.kode}{grup ? ` · ${grup.nama}` : ""}</p>
      </section>

      {grup ? (
        <>
          <section className="space-y-3 rounded-kartu bg-hijau p-5 text-white">
            <p className="text-sm text-white/80">{berlangsung ? "Kelas sedang berlangsung" : fokus ? "Kelas berikutnya" : "Kelas saya"}</p>
            <h2 className="text-xl font-bold">{fokus ? fokus.judul : `${grup.kelas?.jenis_kelamin} · ${grup.kelas?.tingkat}`}</h2>
            <p className="text-sm text-white/90">{fokus ? tanggalIndo(fokus.waktu) : "Belum ada jadwal pertemuan."} · {grup.nama} · {grup.pengajar?.nama || "pengajar belum ditentukan"}</p>
            {tautan ? <TombolGabung link={tautan} pesanAwal={berlangsung && statusFokus?.status === "hadir" ? `✓ Kehadiran Anda tercatat: Hadir${statusFokus.dicatat_oleh === "peserta" ? "" : " (oleh pengajar)"}.` : ""} />
                    : <p className="rounded-2xl bg-white/15 p-3 text-sm">Link kelas belum diisi pengajar atau admin.</p>}
            <p className="text-xs text-white/75">Menekan <b>Gabung Kelas</b> pada jam kelas otomatis mencatat Anda <b>Hadir</b>. Jika tidak sempat masuk, isi absen mandiri di bawah saat absensi dibuka.</p>
          </section>

          {p?.role === "peserta" && absenDibuka.map((x) => (
            <section key={x.id} className="rounded-kartu bg-kuning/90 p-5 text-hijau-tua">
              <p className="text-sm font-medium">Absen mandiri dibuka</p>
              <h2 className="text-lg font-bold">{x.judul}</h2>
              <div className="mt-3 rounded-2xl bg-hijau p-4 text-white"><TombolAbsen pertemuanId={x.id} awal={absensiSaya[x.id]?.status || null} dikunci={absensiSaya[x.id]?.dicatat_oleh === "pengajar"} /></div>
            </section>
          ))}
          {p?.role === "peserta" && !absenDibuka.length && berlangsung && statusFokus?.status !== "hadir" && (
            <p className="rounded-kartu bg-yellow-50 p-4 text-sm text-yellow-900">Anda belum tercatat hadir. Jika tidak masuk lewat tombol Gabung Kelas, tunggu pengajar membuka absensi lalu isi absen mandiri di sini.</p>
          )}

          {p?.role === "peserta" && (
            <section aria-label="Menu utama" className="space-y-3">
              <h2 className="text-lg font-bold text-hijau-tua">Menu Utama</h2>
              <div className="grid grid-cols-2 gap-3">
                <Ubin href="/dashboard/absensi" ikon="✋" judul="Absen" ket={absenDibuka.length ? "Absen mandiri sedang dibuka" : "Riwayat & absen mandiri"} lencana={absenDibuka.length ? "DIBUKA" : null} menonjol={absenDibuka.length > 0} />
                <Ubin href="#kuis" ikon="📝" judul="Kuis" ket={kuisDaftar.length ? `${kuisDaftar.length} kuis terbit` : "Belum ada kuis"} lencana={kuisBelum || null} />
                <Ubin href="#rekaman" ikon="▶️" judul="Rekaman" ket="Rekaman kelas & video pendek" lencana={rekamanBaru.length || null} />
                <Ubin href="#pengumuman" ikon="📢" judul="Pengumuman" ket={pengumuman.length ? "Kabar terbaru" : "Belum ada"} lencana={pengumuman.length || null} />
                <Ubin href="/dashboard/kelas" ikon="📚" judul="Materi" ket="Materi per pertemuan" />
                <Ubin href="/dashboard/rapor" ikon="📊" judul="Rapor" ket="Nilai & kehadiran saya" />
              </div>
            </section>
          )}

          <section id="kuis" className="kartu scroll-mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-hijau">📝 Kuis</h2><Link href="/dashboard/kelas" className="text-sm font-medium text-hijau underline">Semua</Link></div>
            {kuisDaftar.length ? (
              <ul className="divide-y divide-hijau/10">
                {kuisDaftar.map((q) => (
                  <li key={q.id}><Link href={`/dashboard/kuis/${q.id}`} className="flex items-center justify-between gap-3 py-3">
                    <span className="font-medium">{q.judul}</span>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${q.id in nilaiKuis ? "bg-hijau-muda text-hijau-tua" : "bg-kuning/40 text-hijau-tua"}`}>{q.id in nilaiKuis ? (nilaiKuis[q.id] != null ? `Nilai ${nilaiKuis[q.id]}` : "Menunggu nilai") : "Kerjakan"}</span>
                  </Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-tinta/60">Belum ada kuis yang terbit.</p>}
          </section>

          <section id="rekaman" className="kartu scroll-mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-hijau">▶️ Rekaman &amp; Video Pendek</h2><Link href="/dashboard/kelas" className="text-sm font-medium text-hijau underline">Semua</Link></div>
            {rekamanBaru.length ? (
              <ul className="space-y-3">
                {rekamanBaru.map((rk) => (
                  <li key={rk.id}><Link href={`/dashboard/kelas/${rk.pertemuan_id}`} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {rk.video_path ? <span aria-hidden className="flex h-[68px] w-[120px] shrink-0 items-center justify-center rounded-xl bg-hijau text-3xl text-white">▶</span> : <img src={`https://i.ytimg.com/vi/${rk.youtube_id}/mqdefault.jpg`} alt="" width="120" height="68" loading="lazy" className="h-[68px] w-[120px] shrink-0 rounded-xl bg-hijau-muda object-cover" />}
                    <span className="font-medium leading-snug">{rk.judul}{(rk.mulai_detik != null || rk.selesai_detik != null) && <span className="ml-2 rounded-full bg-kuning/30 px-2 py-0.5 text-xs font-semibold text-hijau-tua">Klip</span>}{rk.video_path && <span className="ml-2 rounded-full bg-kuning/30 px-2 py-0.5 text-xs font-semibold text-hijau-tua">Video pendek</span>}</span>
                  </Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-tinta/60">Belum ada rekaman.</p>}
          </section>
          {p?.role === "peserta" && (
            <section id="pengumuman" className="kartu scroll-mt-4 space-y-3">
              <h2 className="text-lg font-semibold text-hijau">📢 Pengumuman</h2>
              {pengumuman.length ? (
                <ul className="space-y-3">
                  {pengumuman.map((x) => (
                    <li key={x.id} className="relative overflow-hidden rounded-2xl bg-hijau-muda/60 p-4 pl-5">
                      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-kuning to-jingga" />
                      <p className="font-semibold leading-snug text-hijau-tua">{x.judul}</p>
                      {x.dibuat_pada && <p className="text-xs text-tinta/60">{tanggalPendek(x.dibuat_pada)}</p>}
                      <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm" dir="auto">{x.isi}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-tinta/60">Belum ada pengumuman.</p>}
              <Link href="/#pengumuman" className="text-sm font-medium text-hijau underline">Lihat semua di beranda situs</Link>
            </section>
          )}
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
        <details className="kartu">
          <summary className="cursor-pointer text-lg font-semibold text-hijau">Teman satu grup ({teman.length})</summary>
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{teman.map((t) => <li key={t.nama_lengkap} className="py-1">{t.nama_lengkap}</li>)}</ul>
        </details>
      )}
      {grup && (
        <section className="kartu space-y-3">
          <h2 className="text-lg font-semibold text-hijau">Progres belajar</h2>
          <div className="h-3 overflow-hidden rounded-full bg-hijau-muda" role="progressbar" aria-valuenow={persen} aria-valuemin="0" aria-valuemax="100" aria-label="Progres belajar">
            <div className="h-full rounded-full bg-hijau" style={{ width: `${persen}%` }} />
          </div>
          <p className="text-sm">{persen}% · {selesai} dari {total} materi dan rekaman selesai</p>
          <Link href="/dashboard/kelas" className="btn-hijau w-full">Buka kelas</Link>
        </section>
      )}
      <AktifkanNotifikasi />
    </div>
  );
}
