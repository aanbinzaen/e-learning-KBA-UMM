import { semua } from "@/lib/rekap";

// Nilai kuis per peserta: memakai NILAI TERBAIK dari tiap kuis yang sudah diterbitkan.
export async function nilaiGrup(supabase, grup) {
  const [{ data: kuis, error: e1 }, { data: anggota, error: e2 }] = await Promise.all([
    supabase.from("kuis").select("id,judul").eq("grup_id", grup.id).eq("diterbitkan", true).order("dibuat_pada"),
    supabase.rpc("anggota_grup_daftar", { gid: grup.id }),
  ]);
  if (e1 || e2) throw new Error((e1 || e2).message);
  const ids = (kuis || []).map((k) => k.id);
  const perc = ids.length ? await semua(() => supabase.from("percobaan").select("kuis_id,profile_id,nilai").in("kuis_id", ids).not("nilai", "is", null)) : [];
  const terbaik = new Map();
  perc.forEach((p) => { const k = `${p.profile_id}|${p.kuis_id}`; if (!(terbaik.get(k) >= p.nilai)) terbaik.set(k, p.nilai); });
  const baris = (anggota || []).map((a) => {
    const nilai = (kuis || []).map((k) => terbaik.get(`${a.profile_id}|${k.id}`) ?? null);
    const ada = nilai.filter((n) => n !== null);
    return { id: a.profile_id, kode: a.kode, nama: a.nama_lengkap, nilai, dikerjakan: ada.length, rata: ada.length ? Math.round(ada.reduce((x, y) => x + y, 0) / ada.length) : null };
  });
  return { kuis: kuis || [], baris };
}

export function barisCSVNilai(h) {
  const rows = [["nama_lengkap", "kode", ...h.kuis.map((k) => k.judul), "rata_rata"]];
  h.baris.forEach((b) => rows.push([b.nama, b.kode, ...b.nilai.map((n) => n ?? ""), b.rata ?? ""]));
  return rows;
}
