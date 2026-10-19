// CSV UTF-8 dengan BOM agar langsung terbaca benar di Excel. Sel diawali = + - @ diberi tanda ' (cegah formula).
export function keCSV(baris) {
  const esc = (v) => {
    let t = String(v ?? "");
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(t)) t = `'${t}`;
    return `"${t.replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + baris.map((r) => r.map(esc).join(",")).join("\r\n");
}
export function responsCSV(nama, isi) {
  return new Response(isi, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nama}"`, "Cache-Control": "no-store" },
  });
}
