import { randomInt } from "node:crypto";
const HURUF = "abcdefghjkmnpqrstuvwxyz";   // tanpa i, l, o agar tidak membingungkan
const ANGKA = "23456789";
// 6 huruf + 2 angka, diacak. Contoh: "km7tbx4a"
export function buatPassword() {
  const k = [];
  for (let i = 0; i < 6; i++) k.push(HURUF[randomInt(HURUF.length)]);
  for (let i = 0; i < 2; i++) k.push(ANGKA[randomInt(ANGKA.length)]);
  for (let i = k.length - 1; i > 0; i--) { const j = randomInt(i + 1); [k[i], k[j]] = [k[j], k[i]]; }
  return k.join("");
}
export const AUTH_DOMAIN = process.env.AUTH_EMAIL_DOMAIN || "peserta.kbumm.local";
