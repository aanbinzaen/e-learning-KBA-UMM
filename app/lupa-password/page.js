import { SITE, linkWA } from "@/lib/config";
export const metadata = { title: "Lupa password" };

export default function LupaPassword() {
  const wa = linkWA("Assalamu'alaikum, saya lupa password KB-UMM. Kode peserta saya: ");
  return (
    <div className="bagian max-w-xl">
      <h1 className="text-3xl font-bold text-hijau-tua">Lupa password</h1>
      <div className="kartu mt-6 space-y-4 leading-relaxed">
        <p>Password diatur ulang oleh admin. Hubungi pengajar grup Anda atau admin, sebutkan nama lengkap dan kode peserta Anda.</p>
        <p>Anda akan menerima password sementara, lalu diminta menggantinya saat masuk.</p>
        {wa ? <a href={wa} className="btn-hijau w-full">Hubungi admin lewat WhatsApp</a>
            : <p className="rounded-2xl bg-hijau-muda p-4 text-sm">Nomor WhatsApp admin belum diatur ({SITE.nama}).</p>}
      </div>
    </div>
  );
}
