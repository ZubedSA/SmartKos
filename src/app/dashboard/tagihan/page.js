"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import { createClient } from "@/lib/supabase";
import { replacePlaceholders, generateWhatsAppLink, formatRupiah } from "@/lib/whatsapp";

const BULAN_OPTIONS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function TagihanPage() {
    const [tagihanList, setTagihanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedBulan, setSelectedBulan] = useState("");
    const [waTemplate, setWaTemplate] = useState("");
    const supabase = createClient();

    useEffect(() => { fetchTagihan(); fetchTemplate(); }, []);

    const fetchTagihan = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("tagihan")
            .select("*, penyewa!inner(nama, no_hp, jatuh_tempo, kamar!inner(nomor, harga, kos!inner(nama_kos, user_id)))")
            .eq("penyewa.kamar.kos.user_id", user.id)
            .order("created_at", { ascending: false });

        setTagihanList(data || []);
        setLoading(false);
    };

    const fetchTemplate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("wa_templates").select("isi_template").eq("user_id", user.id).single();
        setWaTemplate(data?.isi_template || "Halo {nama}, tagihan kos kamar {kamar} bulan {bulan} sebesar Rp{jumlah}. Jatuh tempo tanggal {jatuh_tempo}.");
    };

    const handleGenerate = async () => {
        if (!selectedBulan) { alert("Pilih bulan terlebih dahulu!"); return; }
        setGenerating(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all penyewa
        const { data: penyewaList } = await supabase
            .from("penyewa")
            .select("*, kamar!inner(nomor, harga, kos!inner(user_id))")
            .eq("kamar.kos.user_id", user.id);

        if (!penyewaList || penyewaList.length === 0) {
            alert("Belum ada penyewa!");
            setGenerating(false);
            return;
        }

        // Check existing tagihan for this month
        const existingIds = tagihanList
            .filter(t => t.bulan === selectedBulan)
            .map(t => t.penyewa_id);

        const newTagihan = penyewaList
            .filter(p => !existingIds.includes(p.id))
            .map(p => ({
                penyewa_id: p.id,
                bulan: selectedBulan,
                jumlah: p.kamar.harga,
                status: "belum",
            }));

        if (newTagihan.length === 0) {
            alert(`Tagihan bulan ${selectedBulan} sudah ter-generate untuk semua penyewa.`);
            setGenerating(false);
            return;
        }

        await supabase.from("tagihan").insert(newTagihan);
        alert(`${newTagihan.length} tagihan berhasil di-generate!`);
        setGenerating(false);
        fetchTagihan();
    };

    const toggleStatus = async (tagihan) => {
        const newStatus = tagihan.status === "lunas" ? "belum" : "lunas";
        await supabase.from("tagihan").update({ status: newStatus }).eq("id", tagihan.id);
        fetchTagihan();
    };

    const sendWhatsApp = async (tagihan) => {
        const data = {
            nama: tagihan.penyewa.nama,
            bulan: tagihan.bulan,
            jumlah: tagihan.jumlah,
            kamar: tagihan.penyewa.kamar.nomor,
            jatuh_tempo: tagihan.penyewa.jatuh_tempo,
        };

        const message = replacePlaceholders(waTemplate, data);
        const link = generateWhatsAppLink(tagihan.penyewa.no_hp, message);

        // Update tanggal kirim
        await supabase.from("tagihan").update({ tanggal_kirim_wa: new Date().toISOString() }).eq("id", tagihan.id);

        window.open(link, "_blank");
        fetchTagihan();
    };

    const columns = [
        {
            key: "penyewa",
            label: "Penyewa",
            render: (val) => (
                <div>
                    <p className="font-medium text-white">{val?.nama}</p>
                    <p className="text-xs text-slate-400">{val?.kamar?.kos?.nama_kos} - Kamar {val?.kamar?.nomor}</p>
                </div>
            ),
        },
        { key: "bulan", label: "Bulan" },
        {
            key: "jumlah",
            label: "Jumlah",
            render: (val) => <span className="font-medium">Rp {formatRupiah(val)}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (val, row) => (
                <button onClick={() => toggleStatus(row)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${val === "lunas"
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    }`}>
                    {val === "lunas" ? "✓ Lunas" : "Belum Lunas"}
                </button>
            ),
        },
        {
            key: "tanggal_kirim_wa",
            label: "WA Terkirim",
            render: (val) => val ? (
                <span className="text-xs text-slate-400">{new Date(val).toLocaleDateString("id-ID")}</span>
            ) : (
                <span className="text-xs text-slate-500">-</span>
            ),
        },
    ];

    const currentMonth = new Date().toLocaleString("id-ID", { month: "long" });

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Tagihan</h1>
                    <p className="text-slate-400">Generate dan kelola tagihan bulanan penyewa.</p>
                </div>
            </div>

            {/* Generate Section */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">Generate Tagihan Bulanan</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={selectedBulan}
                        onChange={(e) => setSelectedBulan(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Pilih Bulan</option>
                        {BULAN_OPTIONS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Generate Tagihan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={tagihanList}
                    emptyMessage="Belum ada tagihan. Generate tagihan bulanan di atas."
                    actions={(row) => (
                        <>
                            {row.penyewa?.no_hp && (
                                <button onClick={() => sendWhatsApp(row)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                    Kirim WA
                                </button>
                            )}
                        </>
                    )}
                />
            )}
        </div>
    );
}
