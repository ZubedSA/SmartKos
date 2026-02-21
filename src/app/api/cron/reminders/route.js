import { createClient } from "@/lib/supabase";
import { sendWhatsAppAPI } from "@/lib/whatsapp_api";
import { replacePlaceholders } from "@/lib/whatsapp";

/**
 * API Route untuk Cron Job Pengingat Tagihan Otomatis
 * Panggil secara berkala (misal 1x sehari pukul 08:00 WIB)
 */
export async function GET(request) {
    // Verifikasi Secret untuk keamanan (atur CRON_SECRET di .env atau Env Vercel)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient();
    const results = [];

    try {
        // 1. Ambil semua user yang mengaktifkan auto reminder
        const { data: activeUsers, error: userError } = await supabase
            .from("users")
            .select("id, name, wa_api_key")
            .eq("wa_auto_reminder_enabled", true)
            .not("wa_api_key", "is", null);

        if (userError) throw userError;

        for (const user of activeUsers) {
            // 2. Ambil template WA milik user ini
            const { data: template } = await supabase
                .from("wa_templates")
                .select("isi_template")
                .eq("user_id", user.id)
                .single();

            if (!template) continue;

            // 3. Ambil semua tagihan BELUM LUNAS dari semua kos milik user ini
            // Join: tagihan -> penyewa -> kamar -> kos
            const { data: unpaidBills, error: billError } = await supabase
                .from("tagihan")
                .select(`
                    id,
                    bulan,
                    jumlah,
                    penyewa:penyewa_id (
                        nama,
                        no_hp,
                        jatuh_tempo,
                        kamar:kamar_id (
                            nomor,
                            kos:kos_id (
                                user_id
                            )
                        )
                    )
                `)
                .eq("status", "belum")
                .is("tanggal_kirim_wa", null) // Kirim hanya yang belum pernah dikirim atau filter per hari
                .filter("penyewa.kamar.kos.user_id", "eq", user.id);

            if (billError) {
                console.error(`Error fetching bills for user ${user.id}:`, billError);
                continue;
            }

            // 4. Kirim pesan untuk setiap tagihan
            for (const bill of unpaidBills) {
                const penyewa = bill.penyewa;
                if (!penyewa || !penyewa.no_hp) continue;

                const messageData = {
                    nama: penyewa.nama,
                    bulan: bill.bulan,
                    jumlah: bill.jumlah,
                    kamar: penyewa.kamar.nomor,
                    jatuh_tempo: penyewa.jatuh_tempo.toString(),
                };

                const message = replacePlaceholders(template.isi_template, messageData);

                // Kirim via API Fonnte
                const sendResult = await sendWhatsAppAPI(penyewa.no_hp, message, user.wa_api_key);

                if (sendResult.status) {
                    // Update tanggal kirim agar tidak duplikat
                    await supabase
                        .from("tagihan")
                        .update({ tanggal_kirim_wa: new Date().toISOString() })
                        .eq("id", bill.id);

                    results.push({ bill_id: bill.id, status: "sent", target: penyewa.no_hp });
                } else {
                    results.push({ bill_id: bill.id, status: "failed", error: sendResult.msg });
                }
            }
        }

        return Response.json({
            success: true,
            processed: results.length,
            details: results
        });

    } catch (error) {
        console.error("Cron Error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
