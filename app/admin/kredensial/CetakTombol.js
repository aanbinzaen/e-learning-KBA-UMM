"use client";
export default function CetakTombol() {
  return <button onClick={() => window.print()} className="btn-hijau">Cetak / simpan PDF</button>;
}
