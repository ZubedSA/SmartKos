import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

        // 1. Check if user exists
        const { data: userProfile, error: userErr } = await supabase
            .from("users")
            .select("id")
            .eq("id", userId)
            .single();

        if (userErr || !userProfile) {
            return NextResponse.json({ error: "User tidak ditemukan di sistem" }, { status: 404 });
        }

        const {
            kos = [],
            kamar = [],
            penyewa = [],
            tagihan = [],
            operasional = [],
            receipt_templates = [],
            wa_templates = []
        } = backupPayload.data || {};

        // STEP 1: Delete all existing user data if mode is 'replace'
        if (mode === "replace") {
            const { data: existingKos, error: findKosErr } = await supabase
                .from("kos")
                .select("id")
                .eq("user_id", userId);

            if (findKosErr) {
                console.error("Gagal memeriksa kos lama:", findKosErr);
            }

            const existingKosIds = (existingKos || []).map(k => k.id);

            if (existingKosIds.length > 0) {
                const { data: existingKamar } = await supabase
                    .from("kamar")
                    .select("id")
                    .in("kos_id", existingKosIds);
                const existingKamarIds = (existingKamar || []).map(km => km.id);

                if (existingKamarIds.length > 0) {
                    const { data: existingPenyewa } = await supabase
                        .from("penyewa")
                        .select("id")
                        .in("kamar_id", existingKamarIds);
                    const existingPenyewaIds = (existingPenyewa || []).map(p => p.id);

                    if (existingPenyewaIds.length > 0) {
                        for (let i = 0; i < existingPenyewaIds.length; i += 100) {
                            const chunk = existingPenyewaIds.slice(i, i + 100);
                            await supabase.from("tagihan").delete().in("penyewa_id", chunk);
                        }
                    }

                    for (let i = 0; i < existingKamarIds.length; i += 100) {
                        const chunk = existingKamarIds.slice(i, i + 100);
                        await supabase.from("penyewa").delete().in("kamar_id", chunk);
                    }
                }

                for (let i = 0; i < existingKosIds.length; i += 100) {
                    const chunk = existingKosIds.slice(i, i + 100);
                    await supabase.from("kamar").delete().in("kos_id", chunk);
                }
            }

            // Clean other user tables
            await supabase.from("operasional").delete().eq("user_id", userId);
            await supabase.from("receipt_templates").delete().eq("user_id", userId);
            await supabase.from("wa_templates").delete().eq("user_id", userId);
            await supabase.from("kos").delete().eq("user_id", userId);
        }

        // STEP 2: Determine if ID remapping is needed
        // Re-mapping is required if mode is 'merge' (to avoid overwriting existing data)
        // or if backup was exported by another user account (to prevent ID collision/theft).
        const isFromDifferentUser = backupPayload.owner?.id && backupPayload.owner.id !== userId;
        const shouldRemap = mode === "merge" || isFromDifferentUser;

        const idMap = {
            kos: {},
            kamar: {},
            penyewa: {}
        };

        // 1. Prepare Kos
        const preparedKos = kos.map(item => {
            const oldId = item.id;
            const newId = shouldRemap || !oldId ? crypto.randomUUID() : oldId;
            if (oldId) idMap.kos[oldId] = newId;

            return {
                id: newId,
                user_id: userId,
                nama_kos: item.nama_kos || "Kos Tanpa Nama",
                alamat: item.alamat || null,
                created_at: item.created_at || new Date().toISOString()
            };
        });
        const validKosIdSet = new Set(preparedKos.map(k => k.id));

        // 2. Prepare Kamar (filter out orphan rooms)
        const preparedKamar = kamar
            .filter(item => item.kos_id && (idMap.kos[item.kos_id] || validKosIdSet.has(item.kos_id)))
            .map(item => {
                const oldId = item.id;
                const newId = shouldRemap || !oldId ? crypto.randomUUID() : oldId;
                if (oldId) idMap.kamar[oldId] = newId;
                const mappedKosId = idMap.kos[item.kos_id] || item.kos_id;

                return {
                    id: newId,
                    kos_id: mappedKosId,
                    nomor: String(item.nomor || "-"),
                    harga: Number(item.harga) || 0,
                    status: item.status === "isi" ? "isi" : "kosong",
                    created_at: item.created_at || new Date().toISOString()
                };
            });
        const validKamarIdSet = new Set(preparedKamar.map(km => km.id));

        // 3. Prepare Penyewa (filter out orphan tenants)
        const preparedPenyewa = penyewa
            .filter(item => item.kamar_id && (idMap.kamar[item.kamar_id] || validKamarIdSet.has(item.kamar_id)))
            .map(item => {
                const oldId = item.id;
                const newId = shouldRemap || !oldId ? crypto.randomUUID() : oldId;
                if (oldId) idMap.penyewa[oldId] = newId;
                const mappedKamarId = idMap.kamar[item.kamar_id] || item.kamar_id;

                const jt = parseInt(item.jatuh_tempo);
                const safeJt = isNaN(jt) ? 1 : Math.min(31, Math.max(1, jt));

                return {
                    id: newId,
                    kamar_id: mappedKamarId,
                    nama: item.nama || "Tanpa Nama",
                    no_hp: item.no_hp || null,
                    tanggal_masuk: item.tanggal_masuk || null,
                    jatuh_tempo: safeJt,
                    created_at: item.created_at || new Date().toISOString()
                };
            });
        const validPenyewaIdSet = new Set(preparedPenyewa.map(p => p.id));

        // 4. Prepare Tagihan (filter out orphan bills)
        const preparedTagihan = tagihan
            .filter(item => item.penyewa_id && (idMap.penyewa[item.penyewa_id] || validPenyewaIdSet.has(item.penyewa_id)))
            .map(item => {
                const oldId = item.id;
                const newId = shouldRemap || !oldId ? crypto.randomUUID() : oldId;
                const mappedPenyewaId = idMap.penyewa[item.penyewa_id] || item.penyewa_id;

                return {
                    id: newId,
                    penyewa_id: mappedPenyewaId,
                    bulan: item.bulan || "Tagihan",
                    jumlah: Number(item.jumlah) || 0,
                    status: item.status === "lunas" ? "lunas" : "belum",
                    tanggal_kirim_wa: item.tanggal_kirim_wa || null,
                    created_at: item.created_at || new Date().toISOString()
                };
            });

        // 5. Prepare Operasional
        const preparedOperasional = operasional.map(item => {
            const oldId = item.id;
            const newId = shouldRemap || !oldId ? crypto.randomUUID() : oldId;
            let mappedKosId = null;
            if (item.kos_id) {
                mappedKosId = idMap.kos[item.kos_id] || (validKosIdSet.has(item.kos_id) ? item.kos_id : null);
            }

            return {
                id: newId,
                user_id: userId,
                kos_id: mappedKosId,
                keterangan: item.keterangan || "Operasional",
                jumlah: Number(item.jumlah) || 0,
                tanggal: item.tanggal || new Date().toISOString().split("T")[0],
                kategori: item.kategori || "Lainnya",
                created_at: item.created_at || new Date().toISOString()
            };
        });

        // 6. Prepare Receipt Templates
        const preparedReceipt = receipt_templates.map(item => {
            const oldId = item.id;
            const newId = shouldRemap || !oldId ? crypto.randomUUID() : oldId;
            let mappedKosId = null;
            if (item.kos_id) {
                mappedKosId = idMap.kos[item.kos_id] || (validKosIdSet.has(item.kos_id) ? item.kos_id : null);
            }

            return {
                id: newId,
                user_id: userId,
                kos_id: mappedKosId,
                nama_bisnis: item.nama_bisnis || "",
                alamat_bisnis: item.alamat_bisnis || "",
                kontak_bisnis: item.kontak_bisnis || "",
                pesan_tambahan: item.pesan_tambahan || "Terima kasih telah melakukan pembayaran tepat waktu.",
                created_at: item.created_at || new Date().toISOString()
            };
        });

        // 7. Prepare WA Templates
        const preparedWa = wa_templates.map(item => {
            const oldId = item.id;
            const newId = shouldRemap || !oldId ? crypto.randomUUID() : oldId;
            return {
                id: newId,
                user_id: userId,
                isi_template: item.isi_template || "Halo {nama}, ini adalah tagihan kos kamar {kamar} untuk bulan {bulan} sebesar Rp{jumlah}. Jatuh tempo tanggal {jatuh_tempo}. Terima kasih.",
                created_at: item.created_at || new Date().toISOString()
            };
        });

        // STEP 3: Execute insertions in sequential batches with error handling
        
        // Insert Kos
        for (let i = 0; i < preparedKos.length; i += 50) {
            const chunk = preparedKos.slice(i, i + 50);
            const { error: kosErr } = await supabase.from("kos").upsert(chunk);
            if (kosErr) {
                console.error("Error inserting kos:", kosErr);
                throw new Error("Gagal menyimpan data kos: " + kosErr.message);
            }
        }

        // Insert Kamar
        for (let i = 0; i < preparedKamar.length; i += 50) {
            const chunk = preparedKamar.slice(i, i + 50);
            const { error: kamarErr } = await supabase.from("kamar").upsert(chunk);
            if (kamarErr) {
                console.error("Error inserting kamar:", kamarErr);
                throw new Error("Gagal menyimpan data kamar: " + kamarErr.message);
            }
        }

        // Insert Penyewa
        for (let i = 0; i < preparedPenyewa.length; i += 50) {
            const chunk = preparedPenyewa.slice(i, i + 50);
            const { error: penyewaErr } = await supabase.from("penyewa").upsert(chunk);
            if (penyewaErr) {
                console.error("Error inserting penyewa:", penyewaErr);
                throw new Error("Gagal menyimpan data penyewa: " + penyewaErr.message);
            }
        }

        // Insert Tagihan
        for (let i = 0; i < preparedTagihan.length; i += 50) {
            const chunk = preparedTagihan.slice(i, i + 50);
            const { error: tagihanErr } = await supabase.from("tagihan").upsert(chunk);
            if (tagihanErr) {
                console.error("Error inserting tagihan:", tagihanErr);
                throw new Error("Gagal menyimpan data tagihan: " + tagihanErr.message);
            }
        }

        // Insert Operasional
        for (let i = 0; i < preparedOperasional.length; i += 50) {
            const chunk = preparedOperasional.slice(i, i + 50);
            const { error: opsErr } = await supabase.from("operasional").upsert(chunk);
            if (opsErr) {
                console.error("Error inserting operasional:", opsErr);
            }
        }

        // Insert Receipt Templates (without invalid onConflict)
        if (preparedReceipt.length > 0) {
            try {
                if (mode === "replace") {
                    await supabase.from("receipt_templates").delete().eq("user_id", userId);
                }
                const { error: receiptErr } = await supabase.from("receipt_templates").upsert(preparedReceipt);
                if (receiptErr) console.error("Error restoring receipt_templates:", receiptErr);
            } catch (e) {
                console.error("Error in receipt_templates restore:", e);
            }
        }

        // Insert WA Templates
        if (preparedWa.length > 0) {
            try {
                if (mode === "replace") {
                    await supabase.from("wa_templates").delete().eq("user_id", userId);
                }
                const { error: waErr } = await supabase.from("wa_templates").upsert(preparedWa);
                if (waErr) console.error("Error restoring wa_templates:", waErr);
            } catch (e) {
                console.error("Error in wa_templates restore:", e);
            }
        }

        // Restore User Preferences safely
        if (backupPayload.owner?.preferences) {
            try {
                const updatePayload = {};
                if (backupPayload.owner.preferences.auto_generate_billing_enabled !== undefined) {
                    updatePayload.auto_generate_billing_enabled = backupPayload.owner.preferences.auto_generate_billing_enabled;
                }
                if (backupPayload.owner.preferences.wa_auto_reminder_enabled !== undefined) {
                    updatePayload.wa_auto_reminder_enabled = backupPayload.owner.preferences.wa_auto_reminder_enabled;
                }
                if (Object.keys(updatePayload).length > 0) {
                    await supabase.from("users").update(updatePayload).eq("id", userId);
                }
            } catch (prefErr) {
                console.error("Error updating user preferences:", prefErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: mode === "replace"
                ? `Data berhasil digantikan: ${preparedKos.length} kos, ${preparedKamar.length} kamar, ${preparedPenyewa.length} penyewa, ${preparedTagihan.length} tagihan.`
                : `Data berhasil digabungkan: ${preparedKos.length} kos, ${preparedKamar.length} kamar, ${preparedPenyewa.length} penyewa, ${preparedTagihan.length} tagihan ditambahkan.`,
            restored: {
                total_kos: preparedKos.length,
                total_kamar: preparedKamar.length,
                total_penyewa: preparedPenyewa.length,
                total_tagihan: preparedTagihan.length,
                total_operasional: preparedOperasional.length
            }
        });
    } catch (err) {
        console.error("Backup restore error:", err);
        return NextResponse.json({ error: "Gagal memproses restore data: " + (err.message || String(err)) }, { status: 500 });
    }
}
