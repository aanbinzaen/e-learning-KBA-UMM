"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { simpanPeserta, resetPassword } from "./actions";

function Simpan() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="btn-hijau w-full disabled:opacity-60">{pending ? "Menyimpan…" : "Simpan perubahan"}</button>;
}

export default function FormPeserta({ p, grupId, daftarGrup }) {
  const [state, aksi] = useFormState(simpanPeserta.bind(null, p.id), null);
  const [reset, setReset] = useState(null);
  const [sibuk, mulai] = useTransition();
  return (
    <div className="space-y-5">
      <form action={aksi} className="kartu space-y-4">
        <div><label className="label" htmlFor="nama_lengkap">Nama lengkap</label><input id="nama_lengkap" name="nama_lengkap" defaultValue={p.nama_lengkap} className="input" required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="jk">Jenis kelamin</label>
            <select id="jk" name="jenis_kelamin" defaultValue={p.jenis_kelamin || ""} className="input"><option value="">–</option><option>Ikhwan</option><option>Akhwat</option></select></div>
          <div><label className="label" htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue={p.role} className="input"><option value="peserta">Peserta</option><option value="pengajar">Pengajar</option><option value="admin">Admin</option></select></div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={p.email || ""} className="input" /></div>
          <div><label className="label" htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={p.whatsapp || ""} className="input" placeholder="0812xxxxxxx" /></div>
        </div>
        <div><label className="label" htmlFor="grup_id">Kelas dan grup (ubah untuk memindahkan)</label>
          <select id="grup_id" name="grup_id" defaultValue={grupId || ""} className="input">
            <option value="">– tanpa grup –</option>
            {daftarGrup.map((g) => <option key={g.id} value={g.id}>{g.kelas?.jenis_kelamin} · {g.kelas?.tingkat} · {g.nama}</option>)}
          </select></div>
        <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="aktif" defaultChecked={p.aktif} className="h-6 w-6 accent-[#1E7B34]" /> Akun aktif</label>
        {state?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.galat}</p>}
        {state?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{state.ok}</p>}
        <Simpan />
      </form>

      <div className="kartu space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Reset password</h2>
        <p className="text-sm text-tinta/70">Membuat password sementara baru. Peserta wajib menggantinya saat masuk.</p>
        <button type="button" disabled={sibuk} onClick={() => { if (confirm("Reset password peserta ini?")) mulai(async () => setReset(await resetPassword(p.id))); }} className="btn-kuning w-full">{sibuk ? "Memproses…" : "Reset password"}</button>
        {reset?.password && <p role="status" className="rounded-2xl bg-hijau-muda p-4 text-center">Password sementara: <b className="font-mono text-xl">{reset.password}</b><br /><span className="text-sm">Sampaikan langsung ke peserta.</span></p>}
        {reset?.galat && <p role="alert" className="text-sm text-red-700">{reset.galat}</p>}
      </div>
    </div>
  );
}
