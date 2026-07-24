import { createClient } from "@supabase/supabase-js";

const BULAN_INDONESIA = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * API Route untuk Auto Generate Tagihan Bulanan
 * Panggil secara berkala (misal 1x sebulan atau setiap hari untuk memastikan tidak ada yang terlewat)
 */
export async function GET(request) {
    // Verifikasi Secret untuk keamanan
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();
    // Gunakan format "Bulan Tahun" agar unik setiap tahunnya
    const currentMonth = BULAN_INDONESIA[now.getMonth()];
    const currentYear = now.getFullYear();
    const bulanTagihan = `${currentMonth} ${currentYear}`;

    try {
        // 1. Ambil semua penyewa yang owner-nya mengaktifkan auto billing
        // Join: penyewa -> kamar -> kos -> users
        const { data: penyewaList, error: penyewaError } = await supabase
            .from("penyewa")
            .select(`
                id,
                kamar:kamar_id (
                    harga,
                    kos:kos_id (
                        user:user_id (
                            auto_generate_billing_enabled
                        )
                    )
                )
            `)
            .filter("kamar.kos.user.auto_generate_billing_enabled", "eq", true);

        if (penyewaError) throw penyewaError;

        if (!penyewaList || penyewaList.length === 0) {
            return Response.json({ success: true, message: "Tidak ada penyewa aktif." });
        }

        // 2. Ambil tagihan yang sudah ada untuk bulan ini
        const { data: existingTagihan, error: tagihanError } = await supabase
            .from("tagihan")
            .select("penyewa_id")
            .eq("bulan", bulanTagihan);

        if (tagihanError) throw tagihanError;

        const existingPenyewaIds = new Set(existingTagihan.map(t => t.penyewa_id));
        const newBills = [];

        // 3. Filter penyewa yang belum punya tagihan bulan ini
        for (const penyewa of penyewaList) {
            if (!existingPenyewaIds.has(penyewa.id)) {
                newBills.push({
                    penyewa_id: penyewa.id,
                    bulan: bulanTagihan,
                    jumlah: penyewa.kamar.harga,
                    status: "belum"
                });
            }
        }

        if (newBills.length === 0) {
            return Response.json({ success: true, message: "Semua tagihan bulan ini sudah di-generate." });
        }

        // 4. Insert tagihan baru
        const { error: insertError } = await supabase
            .from("tagihan")
            .insert(newBills);

        if (insertError) throw insertError;

        return Response.json({
            success: true,
            message: `${newBills.length} tagihan baru berhasil di-generate untuk periode ${bulanTagihan}.`,
            count: newBills.length
        });

    } catch (error) {
        console.error("Generate Bills Error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
