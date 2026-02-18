"use client";

// Perubahan pemicu untuk sinkronisasi Vercel
import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
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
    const [activeTab, setActiveTab] = useState("belum"); // 'belum' or 'lunas'
    const [selectedTagihan, setSelectedTagihan] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const supabase = createClient();

    useEffect(() => { fetchTagihan(); fetchTemplate(); }, []);

    const fetchTagihan = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Simplified select relying on RLS
            const { data, error } = await supabase
                .from("tagihan")
                .select("*, penyewa(id, nama, no_hp, jatuh_tempo, kamar(nomor, harga, kos(nama_kos)))")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTagihanList(data || []);
        } catch (error) {
            console.error("Error fetching tagihan data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplate = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("wa_templates").select("isi_template").single();
            setWaTemplate(data?.isi_template || "Halo {nama}, tagihan kos kamar {kamar} bulan {bulan} sebesar Rp{jumlah}. Jatuh tempo tanggal {jatuh_tempo}.");
        } catch (error) {
            console.error("Error fetching wa template:", error);
        }
    };

    const handleGenerate = async () => {
        if (!selectedBulan) { alert("Pilih bulan terlebih dahulu!"); return; }
        setGenerating(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get all penyewa (RLS will filter by owner)
            const { data: penyewaList, error } = await supabase
                .from("penyewa")
                .select("*, kamar(nomor, harga, kos(user_id))");

            if (error) throw error;

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
            fetchTagihan();
        } catch (error) {
            console.error("Error generating tagihan:", error);
            alert("Gagal generate tagihan: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSettlePayment = async () => {
        if (!selectedTagihan) return;
        try {
            const { error } = await supabase
                .from("tagihan")
                .update({ status: "lunas" })
                .eq("id", selectedTagihan.id);

            if (error) throw error;
            alert("Pembayaran berhasil diselesaikan!");
            setShowPaymentModal(false);
            fetchTagihan();
        } catch (error) {
            alert("Gagal memproses pembayaran: " + error.message);
        }
    };

    const handleDoubleClick = (row) => {
        if (row.status === "belum") {
            setSelectedTagihan(row);
            setShowPaymentModal(true);
        } else {
            setSelectedReceipt(row);
            setShowReceiptModal(true);
        }
    };

    const handleShowReceipt = (row) => {
        setSelectedReceipt(row);
        setShowReceiptModal(true);
    };

    const handlePrintReceipt = () => {
        window.print();
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

    const filteredData = tagihanList.filter(t => t.status === activeTab);

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
            key: "tanggal_kirim_wa",
            label: "WA Terakhir",
            render: (val) => val ? (
                <span className="text-xs text-slate-400">{new Date(val).toLocaleDateString("id-ID")}</span>
            ) : (
                <span className="text-xs text-slate-500">-</span>
            ),
        },
    ];

    return (
        <div className="pb-24 lg:pb-0">
            {/* Global style for printing */}
            <style jsx global>{`
                @media print {
                    nav, .lg\\:pb-0, .pb-24, button, .flex, .bg-\\[\\#1e293b\\], .border, select, .p-1 {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
                        padding: 40px !important;
                    }
                    body {
                        background: white !important;
                    }
                }
                .print-only { display: none; }
            `}</style>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Tagihan</h1>
                    <p className="text-slate-400 text-sm">Kelola pembayaran sewa kamar Anda.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-[#1e293b] rounded-xl w-fit mb-6">
                <button
                    onClick={() => setActiveTab("belum")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "belum" ? "bg-indigo-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                    Belum Lunas ({tagihanList.filter(t => t.status === "belum").length})
                </button>
                <button
                    onClick={() => setActiveTab("lunas")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "lunas" ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                    Lunas ({tagihanList.filter(t => t.status === "lunas").length})
                </button>
            </div>

            {/* Generate Section (Only show on 'Belum Lunas' tab for clarity) */}
            {activeTab === "belum" && (
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 mb-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Generate Tagihan Bulanan</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={selectedBulan}
                            onChange={(e) => setSelectedBulan(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Pilih Bulan</option>
                            {BULAN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
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
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredData}
                    onRowDoubleClick={handleDoubleClick}
                    emptyMessage={activeTab === "belum" ? "Tidak ada tagihan tertunggak." : "Belum ada tagihan lunas."}
                    actions={(row) => (
                        <div className="flex gap-2">
                            {row.status === "belum" && (
                                <button
                                    onClick={() => sendWhatsApp(row)}
                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    title="Kirim Pengingat WA"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                </button>
                            )}
                            {row.status === "lunas" && (
                                <button
                                    onClick={() => handleShowReceipt(row)}
                                    className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                                    title="Unduh Kwitansi"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                />
            )}

            {/* Payment Settlement Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Konfirmasi Pembayaran"
            >
                {selectedTagihan && (
                    <div className="space-y-6">
                        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-700">
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Detail Tagihan</p>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Penyewa</span>
                                    <span className="text-white font-medium">{selectedTagihan.penyewa?.nama}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Kamar</span>
                                    <span className="text-white font-medium">{selectedTagihan.penyewa?.kamar?.nomor}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Bulan</span>
                                    <span className="text-white font-medium">{selectedTagihan.bulan}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Total</span>
                                    <span className="text-indigo-400 text-xl font-bold">Rp {formatRupiah(selectedTagihan.jumlah)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={handleSettlePayment}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                            >
                                Tandai Sebagai Lunas
                            </button>
                            <button
                                onClick={() => sendWhatsApp(selectedTagihan)}
                                className="w-full py-3 px-4 rounded-xl border border-slate-700 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-medium"
                            >
                                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                Kirim Tagihan via WhatsApp
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Receipt Modal */}
            <Modal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                title="Kwitansi Pembayaran"
            >
                {selectedReceipt && (
                    <div className="space-y-6">
                        <div id="receipt-content" className="receipt-box bg-white text-slate-900 rounded-lg p-8 shadow-sm font-sans border border-slate-200">
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter italic">SmartKos</h2>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{selectedReceipt.penyewa?.kamar?.kos?.nama_kos}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-sm font-black uppercase">Kwitansi</h3>
                                    <p className="text-[10px] text-slate-500">#{selectedReceipt.id.toString().slice(-8).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="flex border-b border-slate-100 pb-2">
                                    <span className="w-32 text-slate-500 text-xs font-bold uppercase italic">Sudah Terima Dari:</span>
                                    <span className="font-bold border-b border-slate-900 flex-1 px-2">{selectedReceipt.penyewa?.nama}</span>
                                </div>
                                <div className="flex border-b border-slate-100 pb-2">
                                    <span className="w-32 text-slate-500 text-xs font-bold uppercase italic">Banyaknya Uang:</span>
                                    <span className="font-bold border-b border-slate-900 flex-1 px-2">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                </div>
                                <div className="flex border-b border-slate-100 pb-2">
                                    <span className="w-32 text-slate-500 text-xs font-bold uppercase italic">Untuk Pembayaran:</span>
                                    <span className="font-bold border-b border-slate-900 flex-1 px-2">Sewa Kamar {selectedReceipt.penyewa?.kamar?.nomor} - Bulan {selectedReceipt.bulan}</span>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-between items-end">
                                <div className="bg-slate-900 text-white px-6 py-3 rounded italic font-black text-xl skew-x-[-12deg]">
                                    <span className="inline-block skew-x-[12deg]">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-8">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <div className="w-32 border-b border-slate-900 mx-auto"></div>
                                    <p className="text-[10px] text-slate-900 font-bold uppercase mt-1">Pemilik Kos</p>
                                </div>
                            </div>
                        </div>

                        {/* Hidden print only section */}
                        <div className="print-only">
                            <div className="receipt-box bg-white text-slate-900 font-sans">
                                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-4">
                                    <div>
                                        <h2 className="text-2xl font-black uppercase italic">SmartKos</h2>
                                        <p className="text-xs font-bold uppercase tracking-widest">{selectedReceipt.penyewa?.kamar?.kos?.nama_kos}</p>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-lg font-black uppercase">Kwitansi</h3>
                                        <p className="text-xs text-slate-500">#{selectedReceipt.id.toString().slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 text-base py-4">
                                    <div className="flex">
                                        <span className="w-48 text-slate-500 font-bold uppercase italic">Sudah Terima Dari:</span>
                                        <span className="font-bold border-b-2 border-slate-900 flex-1 px-2 text-xl">{selectedReceipt.penyewa?.nama}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 text-slate-500 font-bold uppercase italic">Banyaknya Uang:</span>
                                        <span className="font-bold border-b-2 border-slate-900 flex-1 px-2 text-xl italic underline decoration-double">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 text-slate-500 font-bold uppercase italic">Untuk Pembayaran:</span>
                                        <span className="font-bold border-b-2 border-slate-900 flex-1 px-2 text-xl">Sewa Kamar {selectedReceipt.penyewa?.kamar?.nomor} - Bulan {selectedReceipt.bulan}</span>
                                    </div>
                                </div>

                                <div className="mt-20 flex justify-between items-end">
                                    <div className="bg-slate-900 text-white px-10 py-5 rounded italic font-black text-3xl skew-x-[-12deg]">
                                        <span className="inline-block skew-x-[12deg]">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="mb-16 font-bold uppercase text-xl">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <div className="w-64 border-b-2 border-slate-900 mr-0"></div>
                                        <p className="font-bold uppercase mt-2 text-lg">Pemilik Kos</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handlePrintReceipt}
                                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Cetak Kwitansi
                            </button>
                            <button
                                onClick={() => alert("Gunakan tombol 'Cetak' lalu pilih 'Simpan sebagai PDF' untuk membagikan.")}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Bagikan
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
