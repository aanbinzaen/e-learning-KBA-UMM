export default function TabelRekap({ judul, rekap }) {
  return (
    <section className="kartu !p-0 overflow-hidden">
      <h3 className="bg-hijau-muda px-4 py-3 font-semibold text-hijau-tua">{judul} <span className="font-normal text-tinta/70">· {rekap.pertemuan.length} pertemuan terlaksana</span></h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead><tr className="text-tinta/60"><th className="p-3">Nama</th><th className="p-3">Kode</th><th className="p-3 text-center">Hadir</th><th className="p-3 text-center">Izin</th><th className="p-3 text-center">Sakit</th><th className="p-3 text-center">Alpa</th><th className="p-3 text-right">Kehadiran</th></tr></thead>
          <tbody>
            {rekap.baris.map((b) => (
              <tr key={b.id} className="border-t border-hijau/10">
                <td className="p-3">{b.nama}</td><td className="p-3 font-mono">{b.kode}</td>
                <td className="p-3 text-center">{b.hadir}</td><td className="p-3 text-center">{b.izin}</td><td className="p-3 text-center">{b.sakit}</td><td className="p-3 text-center">{b.alpa}</td>
                <td className="p-3 text-right font-semibold">{b.persen}%</td>
              </tr>
            ))}
            {!rekap.baris.length && <tr><td colSpan="7" className="p-4 text-tinta/60">Belum ada peserta di grup ini.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
