/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // web-push memakai modul bawaan Node; dibiarkan sebagai paket eksternal di sisi server
  experimental: { serverComponentsExternalPackages: ["web-push"] },
};
export default nextConfig;
