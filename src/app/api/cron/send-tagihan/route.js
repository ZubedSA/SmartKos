import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { replacePlaceholders } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// This cron job should be triggered daily
export async function GET(request) {
    try {
        // Verify authorization if needed (e.g. cron secret)
        const authHeader = request.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
        }

        // We need service role to bypass RLS since there's no user session
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const today = new Date();
        const currentDay = today.getDate().toString();
        
        // 1. Fetch all unpaid tagihan
        const { data: tagihanList, error: tagihanError } = await supabase
            .from("tagihan")
            .select("*, penyewa!inner(id, nama, no_hp, jatuh_tempo, kamar(nomor, harga, kos(user_id)))")
            .eq("status", "belum");

        if (tagihanError) throw tagihanError;

        // Filter tagihan where jatuh_tempo matches currentDay
        const dueTagihan = tagihanList.filter(t => t.penyewa.jatuh_tempo === currentDay);

        if (dueTagihan.length === 0) {
            return NextResponse.json({ success: true, message: "Tidak ada tagihan yang jatuh tempo hari ini." });
        }

        // 2. Fetch all templates & fonnte tokens
        const userIds = [...new Set(dueTagihan.map(t => t.penyewa.kamar.kos.user_id))];
        const { data: templates, error: templateError } = await supabase
            .from("wa_templates")
            .select("user_id, isi_template, fonnte_token")
            .in("user_id", userIds);

        if (templateError) throw templateError;

        const templateMap = templates.reduce((acc, curr) => {
            acc[curr.user_id] = curr;
            return acc;
        }, {});

        // 3. Send messages
        let sentCount = 0;
        let failedCount = 0;

        for (const tagihan of dueTagihan) {
            const userId = tagihan.penyewa.kamar.kos.user_id;
            const templateData = templateMap[userId];

            if (!templateData || !templateData.fonnte_token) {
                failedCount++;
                continue; // Skip if no token configured
            }

            const targetNumber = tagihan.penyewa.no_hp;
            const data = {
                nama: tagihan.penyewa.nama,
                bulan: tagihan.bulan,
                jumlah: tagihan.jumlah,
                kamar: tagihan.penyewa.kamar.nomor,
                jatuh_tempo: tagihan.penyewa.jatuh_tempo,
            };
            const message = replacePlaceholders(templateData.isi_template, data);

            const formData = new FormData();
            formData.append("target", targetNumber);
            formData.append("message", message);
            formData.append("delay", "2");

            try {
                const response = await fetch("https://api.fonnte.com/send", {
                    method: "POST",
                    headers: { "Authorization": templateData.fonnte_token },
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status) {
                    await supabase
                        .from("tagihan")
                        .update({ tanggal_kirim_wa: new Date().toISOString() })
                        .eq("id", tagihan.id);
                    sentCount++;
                } else {
                    failedCount++;
                }
            } catch (err) {
                console.error("Error sending to Fonnte:", err);
                failedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Proses cron selesai. ${sentCount} terkirim, ${failedCount} gagal/dilewati.` 
        });

    } catch (error) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
