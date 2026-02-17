/**
 * Replace placeholders dalam template WhatsApp dengan data penyewa
 * Placeholder: {nama}, {bulan}, {jumlah}, {kamar}, {jatuh_tempo}
 */
export function replacePlaceholders(template, data) {
    return template
        .replace(/{nama}/g, data.nama || "")
        .replace(/{bulan}/g, data.bulan || "")
        .replace(/{jumlah}/g, formatRupiah(data.jumlah) || "0")
        .replace(/{kamar}/g, data.kamar || "")
        .replace(/{jatuh_tempo}/g, data.jatuh_tempo || "");
}

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(angka) {
    if (!angka) return "0";
    return Number(angka).toLocaleString("id-ID");
}

/**
 * Generate link WhatsApp dengan pesan yang sudah di-encode
 * @param {string} phone - Nomor telepon (format 08xxx atau 62xxx)
 * @param {string} message - Pesan yang sudah di-replace placeholder-nya
 * @returns {string} URL wa.me
 */
export function generateWhatsAppLink(phone, message) {
    // Normalize phone number: hapus +, spasi, strip, dan ubah 08 → 628
    let normalized = phone.replace(/[\s\-\+]/g, "");
    if (normalized.startsWith("08")) {
        normalized = "62" + normalized.substring(1);
    }
    if (!normalized.startsWith("62")) {
        normalized = "62" + normalized;
    }

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${normalized}?text=${encoded}`;
}
