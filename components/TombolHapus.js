"use client";
export default function TombolHapus({ aksi, label = "Hapus", pesan = "Hapus item ini?" }) {
  return (
    <form action={aksi} onSubmit={(e) => { if (!confirm(pesan)) e.preventDefault(); }}>
      <button className="rounded-xl px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">{label}</button>
    </form>
  );
}
