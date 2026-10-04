/**
 * Template default untuk setiap tahap pengingat WhatsApp
 */
export const DEFAULT_REMINDER_TEMPLATES = {
    "h-3": "Halo {nama}, mengingatkan bahwa tagihan sewa kos kamar {kamar} untuk bulan {bulan} sebesar Rp {jumlah} akan jatuh tempo dalam 3 hari pada tanggal {jatuh_tempo}. Mohon dapat dipersiapkan pembayarannya ya. Terima kasih! 🙏",
    "hari-h": "Halo {nama}, hari ini tanggal {jatuh_tempo} adalah batas waktu (jatuh tempo) pembayaran sewa kos kamar {kamar} bulan {bulan} sebesar Rp {jumlah}. Mohon segera melakukan pembayaran dan konfirmasi. Terima kasih! 🙏",
    "overdue": "Halo {nama}, tagihan sewa kos kamar {kamar} bulan {bulan} sebesar Rp {jumlah} telah melewati tanggal jatuh tempo ({jatuh_tempo}) dan saat ini berstatus menunggak. Mohon kerjasamanya untuk segera menyelesaikan pembayaran hari ini. Terima kasih. 🙏",
    "normal": "Halo {nama}, ini adalah tagihan sewa kos kamar {kamar} untuk bulan {bulan} sebesar Rp {jumlah}. Jatuh tempo tanggal {jatuh_tempo}. Terima kasih."
};

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(angka) {
    if (!angka) return "0";
    return Number(angka).toLocaleString("id-ID");
}

/**
 * Replace placeholders dalam template WhatsApp dengan data penyewa
 * Placeholder: {nama}, {bulan}, {jumlah}, {kamar}, {jatuh_tempo}
 */
export function replacePlaceholders(template, data) {
    if (!template) return "";
    return template
        .replace(/{nama}/g, data.nama || "")
        .replace(/{bulan}/g, data.bulan || "")
        .replace(/{jumlah}/g, formatRupiah(data.jumlah) || "0")
        .replace(/{kamar}/g, data.kamar || "")
        .replace(/{jatuh_tempo}/g, data.jatuh_tempo || "");
}

/**
 * Membaca konfigurasi template dan status tahapan reminder (h-3, hari-h, overdue)
 */
export function parseTemplateConfig(rawTemplate) {
    const defaultConfig = {
        template: DEFAULT_REMINDER_TEMPLATES["normal"],
        stages: {
            h3: true,
            hariH: true,
            overdue: true
        }
    };

    if (!rawTemplate) return defaultConfig;

    try {
        const parsed = JSON.parse(rawTemplate);
        if (typeof parsed === "object" && parsed !== null) {
            return {
                template: parsed.template || parsed.normal || DEFAULT_REMINDER_TEMPLATES["normal"],
                stages: {
                    h3: parsed.stages?.h3 ?? true,
                    hariH: parsed.stages?.hariH ?? true,
                    overdue: parsed.stages?.overdue ?? true
                }
            };
        }
    } catch (e) {
        // String template biasa
        return {
            template: rawTemplate,
            stages: {
                h3: true,
                hariH: true,
                overdue: true
            }
        };
    }

    return defaultConfig;
}

/**
 * Menyusun data template dan status tahapan reminder ke format penyimpanan
 */
export function buildTemplateConfig(templateText, stages) {
    return JSON.stringify({
        normal: templateText,
        template: templateText,
        stages: {
            h3: stages?.h3 ?? true,
            hariH: stages?.hariH ?? true,
            overdue: stages?.overdue ?? true
        }
    });
}

/**
 * Mengambil template teks berdasarkan stage (h-3, hari-h, overdue, normal)
 * Mendukung JSON template jika user mengkustomisasi tiap stage
 */
export function getTemplateForStage(rawTemplate, stage = "normal") {
    if (!rawTemplate) return DEFAULT_REMINDER_TEMPLATES[stage] || DEFAULT_REMINDER_TEMPLATES["normal"];
    
    try {
        const parsed = JSON.parse(rawTemplate);
        if (typeof parsed === "object" && parsed !== null) {
            return parsed[stage] || (stage === "normal" ? (parsed.template || parsed.normal) : null) || DEFAULT_REMINDER_TEMPLATES[stage] || DEFAULT_REMINDER_TEMPLATES["normal"];
        }
    } catch (e) {
        // Bukan JSON, berarti string template biasa
        if (stage === "normal") return rawTemplate;
        return DEFAULT_REMINDER_TEMPLATES[stage] || rawTemplate;
    }

    return DEFAULT_REMINDER_TEMPLATES[stage] || DEFAULT_REMINDER_TEMPLATES["normal"];
}

/**
 * Generate link WhatsApp dengan pesan yang sudah di-encode
 * @param {string} phone - Nomor telepon (format 08xxx atau 62xxx)
 * @param {string} message - Pesan yang sudah di-replace placeholder-nya
 * @returns {string} URL wa.me
 */
export function generateWhatsAppLink(phone, message) {
    if (!phone) return "#";
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
