import FormLupa from "./FormLupa";
export const metadata = { title: "Lupa password" };

export default function LupaPassword() {
  return (
    <div className="bagian max-w-xl">
      <h1 className="text-3xl font-bold text-hijau-tua">Lupa password</h1>
      <div className="kartu mt-6 space-y-4 leading-relaxed">
        <p>Password diatur ulang oleh admin kelas Anda. Isi data di bawah, pilih kelas, lalu kirim lewat WhatsApp. Pesan sudah tersusun otomatis.</p>
        <p className="text-sm text-tinta/70">Anda akan menerima password sementara, lalu diminta menggantinya saat masuk.</p>
        <FormLupa />
      </div>
    </div>
  );
}
