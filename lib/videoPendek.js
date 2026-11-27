// Tautan sementara (1 jam) untuk video pendek yang tersimpan di gudang berkas.
export async function urlVideoPendek(supabase, daftar) {
  const peta = {};
  const ada = (daftar || []).filter((r) => r.video_path);
  if (!ada.length) return peta;
  const { data } = await supabase.storage.from("video-pendek").createSignedUrls(ada.map((r) => r.video_path), 3600);
  (data || []).forEach((t, i) => { if (t?.signedUrl) peta[ada[i].id] = t.signedUrl; });
  return peta;
}
