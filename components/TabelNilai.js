export default function TabelNilai({ nilai }) {
  return (
    <section className="kartu !p-0 overflow-hidden">
      <h3 className="bg-hijau-muda px-4 py-3 font-semibold text-hijau-tua">Nilai kuis <span className="font-normal text-tinta/70">· nilai terbaik tiap kuis</span></h3>
      {!nilai.kuis.length ? <p className="p-4 text-sm text-tinta/60">Belum ada kuis yang diterbitkan di grup ini.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="text-tinta/60"><th className="p-3">Nama</th>{nilai.kuis.map((k) => <th key={k.id} className="p-3 text-center">{k.judul}</th>)}<th className="p-3 text-right">Rata-rata</th></tr></thead>
            <tbody>
              {nilai.baris.map((b) => (
                <tr key={b.id} className="border-t border-hijau/10">
                  <td className="p-3">{b.nama}</td>
                  {b.nilai.map((n, i) => <td key={i} className="p-3 text-center">{n ?? "–"}</td>)}
                  <td className="p-3 text-right font-semibold">{b.rata ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
