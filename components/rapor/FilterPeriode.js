// Penyaring periode (GET). tersembunyi: pasangan nama/nilai lain yang perlu dipertahankan, misalnya grup.
export default function FilterPeriode({ rentang, aksi, tersembunyi = {}, anak = null }) {
  return (
    <form method="get" action={aksi} className="no-print kartu flex flex-wrap items-end gap-3">
      {Object.entries(tersembunyi).map(([k, v]) => (Array.isArray(v) ? v : [v]).map((x) => <input key={`${k}${x}`} type="hidden" name={k} value={x} />))}
      <div className="min-w-[9.5rem] flex-1"><label className="label" htmlFor="f-dari">Dari tanggal</label><input id="f-dari" type="date" name="dari" defaultValue={rentang.labelDari || ""} className="input" /></div>
      <div className="min-w-[9.5rem] flex-1"><label className="label" htmlFor="f-sampai">Sampai tanggal</label><input id="f-sampai" type="date" name="sampai" defaultValue={rentang.labelSampai || ""} className="input" /></div>
      {anak}
      <button className="btn-hijau">Terapkan</button>
      {(rentang.labelDari || rentang.labelSampai) && <a href={aksi} className="btn !px-4 text-hijau underline">Semua periode</a>}
    </form>
  );
}
