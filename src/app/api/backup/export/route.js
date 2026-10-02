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

        // 1. Fetch User Info & Preferences
        const { data: userProfile, error: userErr } = await supabase
            .from("users")
            .select("id, name, email, auto_generate_billing_enabled, wa_billing_time")
            .eq("id", userId)
            .single();

        if (userErr || !userProfile) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        }

        // 2. Fetch Kos list
        const { data: kosList } = await supabase
            .from("kos")
            .select("*")
            .eq("user_id", userId);

        const kosIds = (kosList || []).map(k => k.id);

        // 3. Fetch Kamar list
        let kamarList = [];
        if (kosIds.length > 0) {
            const { data: kamarData } = await supabase
                .from("kamar")
                .select("*")
                .in("kos_id", kosIds);
            kamarList = kamarData || [];
        }

        const kamarIds = kamarList.map(km => km.id);

        // 4. Fetch Penyewa list
        let penyewaList = [];
        if (kamarIds.length > 0) {
            const { data: penyewaData } = await supabase
                .from("penyewa")
                .select("*")
                .in("kamar_id", kamarIds);
            penyewaList = penyewaData || [];
        }

        const penyewaIds = penyewaList.map(p => p.id);

        // 5. Fetch Tagihan list
        let tagihanList = [];
        if (penyewaIds.length > 0) {
            const { data: tagihanData } = await supabase
                .from("tagihan")
                .select("*")
                .in("penyewa_id", penyewaIds);
            tagihanList = tagihanData || [];
        }

        // 6. Fetch Operasional list
        const { data: operasionalList } = await supabase
            .from("operasional")
            .select("*")
            .eq("user_id", userId);

        // 7. Fetch Receipt Template
        const { data: receiptTemplate } = await supabase
            .from("receipt_templates")
            .select("*")
            .eq("user_id", userId);

        // 8. Fetch WA Template
        const { data: waTemplate } = await supabase
            .from("wa_templates")
            .select("*")
            .eq("user_id", userId);

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
                    auto_generate_billing_enabled: userProfile.auto_generate_billing_enabled,
                    wa_billing_time: userProfile.wa_billing_time
                }
            },
            summary: {
                total_kos: kosList?.length || 0,
                total_kamar: kamarList.length,
                total_penyewa: penyewaList.length,
                total_tagihan: tagihanList.length,
                total_operasional: operasionalList?.length || 0
            },
            data: {
                kos: kosList || [],
                kamar: kamarList,
                penyewa: penyewaList,
                tagihan: tagihanList,
                operasional: operasionalList || [],
                receipt_templates: receiptTemplate || [],
                wa_templates: waTemplate || []
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
