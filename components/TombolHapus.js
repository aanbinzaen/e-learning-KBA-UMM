"use client";
export default function TombolHapus({ aksi, label = "Hapus", pesan = "Hapus item ini?", kelas = "rounded-xl px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" }) {
  return (
    <form action={aksi} onSubmit={(e) => { if (!confirm(pesan)) e.preventDefault(); }}>
      <button className={kelas}>{label}</button>
    </form>
  );
}
