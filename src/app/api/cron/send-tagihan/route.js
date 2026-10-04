import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { replacePlaceholders, getTemplateForStage, parseTemplateConfig } from "@/lib/whatsapp";

const BULAN_INDONESIA = {
    "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
    "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
};

function parseBulanTagihan(bulanStr) {
    if (!bulanStr) return null;
    const parts = bulanStr.trim().split(" ");
    if (parts.length !== 2) return null;

    const monthName = parts[0];
    const year = parseInt(parts[1], 10);
    const monthIndex = BULAN_INDONESIA[monthName];

    if (monthIndex === undefined || isNaN(year)) return null;
    return { monthIndex, year };
}

function isFutureMonth(bulanStr, nowWIB) {
    const parsed = parseBulanTagihan(bulanStr);
    if (!parsed) return false;

    const currentYear = nowWIB.getFullYear();
    const currentMonth = nowWIB.getMonth();

    if (parsed.year > currentYear) return true;
    if (parsed.year === currentYear && parsed.monthIndex > currentMonth) return true;

    return false;
}

/**
 * Mengecek apakah tahap pengingat tertentu diaktifkan oleh pemilik kos
 * Mendukung konfigurasi via tabel users maupun JSON di wa_templates
 */
function isStageActive(stage, userConfig, templateConfig) {
    // 1. Cek kolom tabel users jika tersedia
    if (stage === "h-3" && userConfig.wa_reminder_h3 !== undefined && userConfig.wa_reminder_h3 !== null) {
        return Boolean(userConfig.wa_reminder_h3);
    }
    if (stage === "hari-h" && userConfig.wa_reminder_hari_h !== undefined && userConfig.wa_reminder_hari_h !== null) {
        return Boolean(userConfig.wa_reminder_hari_h);
    }
    if (stage === "overdue" && userConfig.wa_reminder_overdue !== undefined && userConfig.wa_reminder_overdue !== null) {
        return Boolean(userConfig.wa_reminder_overdue);
    }

    // 2. Cek templateConfig (JSON fallback)
    if (templateConfig?.stages) {
        if (stage === "h-3") return Boolean(templateConfig.stages.h3 ?? true);
        if (stage === "hari-h") return Boolean(templateConfig.stages.hariH ?? true);
        if (stage === "overdue") return Boolean(templateConfig.stages.overdue ?? true);
    }

    // Default aktif jika belum diatur
    return true;
}

export const dynamic = "force-dynamic";

// Cron job harian untuk otomatisasi pengingat H-3, Hari-H, dan Menunggak via Fonnte
export async function GET(request) {
    try {
        // 1. Verifikasi authorization header jika CRON_SECRET terpasang di environment
        const authHeader = request.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Waktu saat ini di zona WIB (Asia/Jakarta)
        const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        const currentDay = nowWIB.getDate();
        const currentMonth = nowWIB.getMonth();
        const currentYear = nowWIB.getFullYear();

        // 2. Ambil semua tagihan yang statusnya belum lunas
        const { data: tagihanList, error: tagihanError } = await supabase
            .from("tagihan")
            .select("*, penyewa!inner(id, nama, no_hp, jatuh_tempo, kamar(nomor, harga, kos(user_id)))")
            .eq("status", "belum");

        if (tagihanError) throw tagihanError;

        if (!tagihanList || tagihanList.length === 0) {
            return NextResponse.json({ 
                success: true, 
                message: "Tidak ada tagihan yang belum lunas saat ini.",
                sentCount: 0 
            });
        }

        // 3. Ambil data owner yang mengaktifkan pengingat otomatis (wa_auto_reminder_enabled = true)
        const userIds = [...new Set(tagihanList.map(t => t.penyewa?.kamar?.kos?.user_id).filter(Boolean))];
        
        // Gunakan select("*") agar kompatibel dengan atau tanpa migrasi kolom baru
        const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("*")
            .in("id", userIds);

        if (usersError) throw usersError;

        // Filter user yang mengaktifkan otomatisasi dan punya token Fonnte
        const activeUsersMap = (usersData || []).reduce((acc, user) => {
            if (user.wa_auto_reminder_enabled && user.wa_api_key?.trim()) {
                acc[user.id] = user;
            }
            return acc;
        }, {});

        const activeUserIds = Object.keys(activeUsersMap);
        if (activeUserIds.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Tidak ada pemilik kos yang mengaktifkan Pengingat Otomatis (wa_auto_reminder_enabled) dengan token Fonnte valid.",
                sentCount: 0
            });
        }

        // 4. Ambil template WA untuk owner yang aktif
        const { data: templates } = await supabase
            .from("wa_templates")
            .select("user_id, isi_template")
            .in("user_id", activeUserIds);

        const templateMap = (templates || []).reduce((acc, curr) => {
            acc[curr.user_id] = curr.isi_template;
            return acc;
        }, {});

        // 5. Evaluasi tagihan & kirim pesan sesuai tahap (H-3, Hari-H, atau Menunggak)
        let sentCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        const sendLogs = [];

        for (const tagihan of tagihanList) {
            const userId = tagihan.penyewa?.kamar?.kos?.user_id;
            const userConfig = activeUsersMap[userId];

            // Abaikan jika owner tidak mengaktifkan pengingat otomatis
            if (!userConfig) {
                skippedCount++;
                continue;
            }

            // Abaikan tagihan bulan depan (advance payment)
            if (isFutureMonth(tagihan.bulan, nowWIB)) {
                skippedCount++;
                continue;
            }

            // Periksa tanggal jatuh tempo penyewa
            const jatuhTempo = parseInt(tagihan.penyewa?.jatuh_tempo, 10) || 10;
            const parsedBulan = parseBulanTagihan(tagihan.bulan);

            let stage = null;

            if (parsedBulan) {
                const isPastMonth = 
                    parsedBulan.year < currentYear || 
                    (parsedBulan.year === currentYear && parsedBulan.monthIndex < currentMonth);

                if (isPastMonth) {
                    // Tagihan bulan lalu yang belum bayar = Menunggak
                    stage = "overdue";
                } else if (parsedBulan.year === currentYear && parsedBulan.monthIndex === currentMonth) {
                    // Tagihan bulan berjalan: cek H-3, Hari-H, atau Menunggak
                    if (currentDay === jatuhTempo - 3) {
                        stage = "h-3";
                    } else if (currentDay === jatuhTempo) {
                        stage = "hari-h";
                    } else if (currentDay > jatuhTempo) {
                        stage = "overdue";
                    }
                }
            }

            // Jika hari ini bukan jadwal pengingat untuk tagihan ini, lewati
            if (!stage) {
                skippedCount++;
                continue;
            }

            // Cek apakah pemilik kos mengaktifkan tahap pengingat ini (H-3, Hari-H, atau Menunggak)
            const rawTemplate = templateMap[userId];
            const parsedTemplateConfig = parseTemplateConfig(rawTemplate);

            if (!isStageActive(stage, userConfig, parsedTemplateConfig)) {
                skippedCount++;
                continue; // Dilewati karena dinonaktifkan oleh owner
            }

            // Anti-Spam: Cek apakah hari ini sudah pernah dikirim pengingat untuk tagihan ini
            if (tagihan.tanggal_kirim_wa) {
                const lastSentWIB = new Date(new Date(tagihan.tanggal_kirim_wa).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
                const isAlreadySentToday = 
                    lastSentWIB.getFullYear() === currentYear &&
                    lastSentWIB.getMonth() === currentMonth &&
                    lastSentWIB.getDate() === currentDay;

                if (isAlreadySentToday) {
                    skippedCount++;
                    continue;
                }
            }

            // Siapkan pesan sesuai tahap pengingat
            const templateText = getTemplateForStage(rawTemplate, stage);
            
            const messageData = {
                nama: tagihan.penyewa?.nama,
                bulan: tagihan.bulan,
                jumlah: tagihan.jumlah,
                kamar: tagihan.penyewa?.kamar?.nomor,
                jatuh_tempo: jatuhTempo,
            };
            const message = replacePlaceholders(templateText, messageData);

            // Normalisasi nomor telepon
            let targetNumber = tagihan.penyewa?.no_hp || "";
            targetNumber = targetNumber.replace(/[\s\-\+]/g, "");
            if (targetNumber.startsWith("08")) {
                targetNumber = "62" + targetNumber.substring(1);
            }

            if (!targetNumber) {
                failedCount++;
                continue;
            }

            // Kirim via API Fonnte
            const formData = new FormData();
            formData.append("target", targetNumber);
            formData.append("message", message);
            formData.append("delay", "2");

            try {
                const response = await fetch("https://api.fonnte.com/send", {
                    method: "POST",
                    headers: { "Authorization": userConfig.wa_api_key },
                    body: formData
                });

                const result = await response.json();

                if (result.status) {
                    // Update tanggal_kirim_wa agar tidak terkirim ganda hari ini
                    await supabase
                        .from("tagihan")
                        .update({ tanggal_kirim_wa: new Date().toISOString() })
                        .eq("id", tagihan.id);

                    sentCount++;
                    sendLogs.push({
                        penyewa: tagihan.penyewa?.nama,
                        kamar: tagihan.penyewa?.kamar?.nomor,
                        stage,
                        status: "terkirim"
                    });
                } else {
                    failedCount++;
                    console.error("Gagal Fonnte:", result.reason);
                }
            } catch (err) {
                console.error("Error sending to Fonnte:", err);
                failedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Proses cron pengingat selesai. ${sentCount} terkirim, ${skippedCount} dilewati, ${failedCount} gagal.`,
            stats: {
                totalChecked: tagihanList.length,
                sentCount,
                skippedCount,
                failedCount
            },
            logs: sendLogs
        });

    } catch (error) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
    }
}
