import { wajibGuru } from "@/lib/guru";
import PembuatReels from "@/components/reels/PembuatReels";

export const metadata = { title: "Reels Klip Kajian" };

export default async function Reels() {
  const { supabase, profil, grup } = await wajibGuru();
  const idGrup = (grup || []).map((g) => g.id);
  const [{ data }, { data: pt }] = await Promise.all([
    supabase.from("rekaman").select("id,judul,youtube_id,pertemuan_id,grup_id,pertemuan(judul)").not("youtube_id", "is", null).order("dibuat_pada", { ascending: false }).limit(40),
    idGrup.length ? supabase.from("pertemuan").select("id,judul,grup_id").in("grup_id", idGrup).order("waktu", { ascending: false }).limit(60) : Promise.resolve({ data: [] }),
  ]);
  const rekaman = (data || []).map((r) => ({ id: r.id, judul: r.judul, youtube_id: r.youtube_id, pertemuan_id: r.pertemuan_id, pertemuan: r.pertemuan?.judul || "" }));
  const namaGrup = Object.fromEntries((grup || []).map((g) => [g.id, g.nama]));
  const daftarPertemuan = (pt || []).map((x) => ({ id: x.id, grup_id: x.grup_id, label: `${namaGrup[x.grup_id] ? namaGrup[x.grup_id] + " · " : ""}${x.judul}` }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-hijau-tua">Reels Klip Kajian</h1>
        <p className="text-tinta/80">Ubah potongan kajian menjadi video vertikal 9:16 dengan latar ciri khas KBA-UMM dan judul yang bisa Anda tulis sendiri. Hasilnya diunduh sebagai video untuk Instagram, Status WhatsApp, atau TikTok.</p>
      </div>
      <PembuatReels rekaman={rekaman} daftarPertemuan={daftarPertemuan} pengajar={profil.role === "admin" ? "" : (profil.nama_lengkap || "")} />
    </div>
  );
}
