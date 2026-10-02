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
        const { userId, mode, backupPayload } = body;

        if (!userId || !backupPayload || !backupPayload.data) {
            return NextResponse.json({ error: "Data backup atau User ID tidak valid" }, { status: 400 });
        }

        if (backupPayload.app !== "SmartKos") {
            return NextResponse.json({ error: "Format file backup tidak dikenali. Harus berupa file backup SmartKos." }, { status: 400 });
        }

        const supabase = getAdminClient();

        // Check if user exists
        const { data: userProfile, error: userErr } = await supabase
            .from("users")
            .select("id")
            .eq("id", userId)
            .single();

        if (userErr || !userProfile) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        }

        const { kos = [], kamar = [], penyewa = [], tagihan = [], operasional = [], receipt_templates = [], wa_templates = [] } = backupPayload.data;

        if (mode === "replace") {
            // STEP 1: Delete all existing user data to start clean
            const { data: existingKos } = await supabase.from("kos").select("id").eq("user_id", userId);
            const existingKosIds = (existingKos || []).map(k => k.id);

            if (existingKosIds.length > 0) {
                const { data: existingKamar } = await supabase.from("kamar").select("id").in("kos_id", existingKosIds);
                const existingKamarIds = (existingKamar || []).map(km => km.id);

                if (existingKamarIds.length > 0) {
                    const { data: existingPenyewa } = await supabase.from("penyewa").select("id").in("kamar_id", existingKamarIds);
                    const existingPenyewaIds = (existingPenyewa || []).map(p => p.id);

                    if (existingPenyewaIds.length > 0) {
                        await supabase.from("tagihan").delete().in("penyewa_id", existingPenyewaIds);
                    }
                    await supabase.from("penyewa").delete().in("kamar_id", existingKamarIds);
                }
                await supabase.from("kamar").delete().in("kos_id", existingKosIds);
            }

            await supabase.from("operasional").delete().eq("user_id", userId);
            await supabase.from("receipt_templates").delete().eq("user_id", userId);
            await supabase.from("wa_templates").delete().eq("user_id", userId);
            await supabase.from("kos").delete().eq("user_id", userId);
        }

        // STEP 2: Restore / Insert new data with enforced user_id
        
        // 1. Restore User Preferences if present
        if (backupPayload.owner?.preferences) {
            const { auto_generate_billing_enabled, wa_billing_time } = backupPayload.owner.preferences;
            await supabase
                .from("users")
                .update({
                    auto_generate_billing_enabled: auto_generate_billing_enabled ?? true,
                    ...(wa_billing_time ? { wa_billing_time } : {})
                })
                .eq("id", userId);
        }

        // 2. Insert Kos (ensure user_id = userId)
        if (kos.length > 0) {
            const preparedKos = kos.map(item => ({
                ...item,
                user_id: userId
            }));
            const { error: kosErr } = await supabase.from("kos").upsert(preparedKos);
            if (kosErr) console.error("Error restoring kos:", kosErr);
        }

        // 3. Insert Kamar
        if (kamar.length > 0) {
            const { error: kamarErr } = await supabase.from("kamar").upsert(kamar);
            if (kamarErr) console.error("Error restoring kamar:", kamarErr);
        }

        // 4. Insert Penyewa
        if (penyewa.length > 0) {
            const { error: penyewaErr } = await supabase.from("penyewa").upsert(penyewa);
            if (penyewaErr) console.error("Error restoring penyewa:", penyewaErr);
        }

        // 5. Insert Tagihan
        if (tagihan.length > 0) {
            const { error: tagihanErr } = await supabase.from("tagihan").upsert(tagihan);
            if (tagihanErr) console.error("Error restoring tagihan:", tagihanErr);
        }

        // 6. Insert Operasional
        if (operasional.length > 0) {
            const preparedOperasional = operasional.map(item => ({
                ...item,
                user_id: userId
            }));
            const { error: opsErr } = await supabase.from("operasional").upsert(preparedOperasional);
            if (opsErr) console.error("Error restoring operasional:", opsErr);
        }

        // 7. Insert Receipt Templates
        if (receipt_templates.length > 0) {
            const preparedReceipt = receipt_templates.map(item => ({
                ...item,
                user_id: userId
            }));
            const { error: receiptErr } = await supabase.from("receipt_templates").upsert(preparedReceipt, { onConflict: "user_id" });
            if (receiptErr) console.error("Error restoring receipt_templates:", receiptErr);
        }

        // 8. Insert WA Templates
        if (wa_templates.length > 0) {
            const preparedWa = wa_templates.map(item => ({
                ...item,
                user_id: userId
            }));
            const { error: waErr } = await supabase.from("wa_templates").upsert(preparedWa);
            if (waErr) console.error("Error restoring wa_templates:", waErr);
        }

        return NextResponse.json({
            success: true,
            message: mode === "replace" ? "Data berhasil digantikan dari file backup." : "Data berhasil digabungkan dari file backup."
        });
    } catch (err) {
        console.error("Backup restore error:", err);
        return NextResponse.json({ error: "Gagal memproses restore data: " + err.message }, { status: 500 });
    }
}
