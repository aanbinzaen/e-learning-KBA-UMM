/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // paket berikut dipakai di sisi server (notifikasi, Word, Excel) dan dimuat apa adanya oleh Node
  experimental: { serverComponentsExternalPackages: ["web-push", "docx", "jszip"] },
};
export default nextConfig;
