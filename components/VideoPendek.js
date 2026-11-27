export default function VideoPendek({ url, judul }) {
  if (!url) return <p className="rounded-2xl bg-hijau-muda p-4 text-sm text-tinta/70">Video belum bisa dimuat. Muat ulang halaman.</p>;
  return (
    <div className="flex justify-center rounded-2xl bg-black/90 p-2">
      <video src={url} controls playsInline preload="metadata" aria-label={judul} className="max-h-[70vh] w-full max-w-[320px] rounded-xl" />
    </div>
  );
}
