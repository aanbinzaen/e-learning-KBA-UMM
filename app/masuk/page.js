import Link from "next/link";
import { redirect } from "next/navigation";
import FormMasuk from "./FormMasuk";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Masuk" };

export default async function Masuk() {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <div className="bg-hijau">
      <div className="mx-auto flex min-h-[calc(100vh-60px)] max-w-md flex-col justify-center px-5 py-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-rumah-dakwah-putih.png" alt="Rumah Dakwah Malang" width="200" height="46" className="mx-auto mb-6 h-12 w-auto" />
        <div className="kartu">
          <h1 className="text-2xl font-bold text-hijau-tua">Masuk ke KB-UMM</h1>
          <p className="mb-5 mt-1 text-sm text-tinta/70">Gunakan kode peserta dari pengajar Anda. Login pertama akan meminta Anda mengganti password.</p>
          <FormMasuk />
          <p className="mt-5 text-center text-sm"><Link href="/lupa-password" className="font-medium text-hijau underline">Lupa password?</Link></p>
        </div>
      </div>
    </div>
  );
}
