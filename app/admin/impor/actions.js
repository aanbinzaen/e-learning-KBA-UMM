"use server";
import { wajibAdmin } from "@/lib/auth";
import { periksa, prosesBaris } from "@/lib/impor";

export async function pratinjau(rows) {
  await wajibAdmin();
  if (!Array.isArray(rows) || !rows.length) return { galat: "Berkas kosong." };
  if (rows.length > 600) return { galat: "Maksimal 600 baris per berkas." };
  try { return { hasil: await periksa(rows) }; } catch (e) { return { galat: e.message }; }
}

export async function impor(rows) {
  await wajibAdmin();
  if (!Array.isArray(rows) || rows.length > 20) return { galat: "Kelompok impor terlalu besar." };
  try { return { hasil: await prosesBaris(rows) }; } catch (e) { return { galat: e.message }; }
}
