import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
        }

        const supabase = getAdminClient();

        // 1. Fetch User Info & Preferences safely
        const { data: userProfile, error: userErr } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (userErr || !userProfile) {
            console.error("Export user fetch error:", userErr);
            return NextResponse.json({ error: "User tidak ditemukan: " + (userErr?.message || "Data user kosong") }, { status: 404 });
        }

        // 2. Fetch Kos list
        const { data: kosList, error: kosErr } = await supabase
            .from("kos")
            .select("*")
            .eq("user_id", userId);

        if (kosErr) console.error("Export kos error:", kosErr);
        const kosIds = (kosList || []).map(k => k.id);

        // 3. Fetch Kamar list
        let kamarList = [];
        if (kosIds.length > 0) {
            const { data: kamarData, error: kamarErr } = await supabase
                .from("kamar")
                .select("*")
                .in("kos_id", kosIds);
            if (kamarErr) console.error("Export kamar error:", kamarErr);
            kamarList = kamarData || [];
        }

        const kamarIds = kamarList.map(km => km.id);

        // 4. Fetch Penyewa list
        let penyewaList = [];
        if (kamarIds.length > 0) {
            const { data: penyewaData, error: penyewaErr } = await supabase
                .from("penyewa")
                .select("*")
                .in("kamar_id", kamarIds);
            if (penyewaErr) console.error("Export penyewa error:", penyewaErr);
            penyewaList = penyewaData || [];
        }

        const penyewaIds = penyewaList.map(p => p.id);

        // 5. Fetch Tagihan list
        let tagihanList = [];
        if (penyewaIds.length > 0) {
            const { data: tagihanData, error: tagihanErr } = await supabase
                .from("tagihan")
                .select("*")
                .in("penyewa_id", penyewaIds)
                .limit(10000);
            if (tagihanErr) console.error("Export tagihan error:", tagihanErr);
            tagihanList = tagihanData || [];
        }

        // 6. Fetch Operasional list safely
        let operasionalList = [];
        try {
            const { data: opsData, error: opsErr } = await supabase
                .from("operasional")
                .select("*")
                .eq("user_id", userId)
                .limit(10000);
            if (!opsErr && opsData) operasionalList = opsData;
        } catch (e) {
            console.error("Export operasional error:", e);
        }

        // 7. Fetch Receipt Template safely
        let receiptTemplate = [];
        try {
            const { data: receiptData, error: receiptErr } = await supabase
                .from("receipt_templates")
                .select("*")
                .eq("user_id", userId);
            if (!receiptErr && receiptData) receiptTemplate = receiptData;
        } catch (e) {
            console.error("Export receipt error:", e);
        }

        // 8. Fetch WA Template safely
        let waTemplate = [];
        try {
            const { data: waData, error: waErr } = await supabase
                .from("wa_templates")
                .select("*")
                .eq("user_id", userId);
            if (!waErr && waData) waTemplate = waData;
        } catch (e) {
            console.error("Export wa error:", e);
        }

        // Construct Backup Payload
        const exportDate = new Date().toISOString();
        const backupPayload = {
            version: "1.0",
            app: "SmartKos",
            exported_at: exportDate,
            owner: {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                preferences: {
                    auto_generate_billing_enabled: userProfile.auto_generate_billing_enabled ?? false,
                    ...(userProfile.wa_billing_time ? { wa_billing_time: userProfile.wa_billing_time } : {}),
                    ...(userProfile.wa_auto_reminder_enabled !== undefined ? { wa_auto_reminder_enabled: userProfile.wa_auto_reminder_enabled } : {})
                }
            },
            summary: {
                total_kos: kosList?.length || 0,
                total_kamar: kamarList.length,
                total_penyewa: penyewaList.length,
                total_tagihan: tagihanList.length,
                total_operasional: operasionalList.length
            },
            data: {
                kos: kosList || [],
                kamar: kamarList,
                penyewa: penyewaList,
                tagihan: tagihanList,
                operasional: operasionalList,
                receipt_templates: receiptTemplate,
                wa_templates: waTemplate
            }
        };

        return NextResponse.json({
            success: true,
            backupPayload
        });
    } catch (err) {
        console.error("Backup export error:", err);
        return NextResponse.json({ error: "Gagal memproses backup: " + err.message }, { status: 500 });
    }
}
