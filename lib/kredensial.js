// Mengambil daftar kode + password awal (hanya yang belum diganti), diurutkan per grup.
export async function ambilKredensial(supabase, grupId) {
  let q = supabase.from("peserta_grup")
    .select("grup!inner(id,nama,kelas!inner(jenis_kelamin,tingkat)), profiles!inner(id,kode,nama_lengkap,wajib_ganti_password,aktif)");
  if (grupId) q = q.eq("grup_id", grupId);
  const { data } = await q;
  const ids = (data || []).map((r) => r.profiles.id);
  const sandi = new Map();
  if (ids.length) {
    const { data: pw } = await supabase.from("password_awal").select("profile_id,password").in("profile_id", ids);
    (pw || []).forEach((x) => sandi.set(x.profile_id, x.password));
  }
  return (data || [])
    .map((r) => ({
      grup: r.grup.nama, kelas: `${r.grup.kelas.jenis_kelamin} · ${r.grup.kelas.tingkat}`,
      kode: r.profiles.kode, nama: r.profiles.nama_lengkap,
      password: sandi.get(r.profiles.id) || null, sudahGanti: !r.profiles.wajib_ganti_password,
    }))
    .sort((a, b) => a.kelas.localeCompare(b.kelas) || a.grup.localeCompare(b.grup) || a.kode.localeCompare(b.kode));
}
