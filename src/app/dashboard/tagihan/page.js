"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { createClient } from "@/lib/supabase";
import { replacePlaceholders, generateWhatsAppLink, formatRupiah } from "@/lib/whatsapp";

const getBulanOptions = () => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const options = [];
    const now = new Date();

    // Generate options for the last 3 months and next 3 months
    for (let i = -3; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        options.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
    }
    return options;
};

const BULAN_OPTIONS = getBulanOptions();

export default function TagihanPage() {
    const [tagihanList, setTagihanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedBulan, setSelectedBulan] = useState("");
    const [waTemplate, setWaTemplate] = useState("");
    const [activeTab, setActiveTab] = useState("belum"); // 'belum' or 'lunas'
    const [selectedTagihan, setSelectedTagihan] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [settleLoading, setSettleLoading] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [autoBillingEnabled, setAutoBillingEnabled] = useState(false);
    const [togglingAutoBilling, setTogglingAutoBilling] = useState(false);

    const supabase = createClient();

    useEffect(() => { fetchTagihan(); fetchTemplate(); fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("users").select("auto_generate_billing_enabled").eq("id", user.id).single();
            if (data) setAutoBillingEnabled(data.auto_generate_billing_enabled);
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const handleToggleAutoBilling = async () => {
        setTogglingAutoBilling(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const newValue = !autoBillingEnabled;
            const { error } = await supabase
                .from("users")
                .update({ auto_generate_billing_enabled: newValue })
                .eq("id", user.id);
            if (error) throw error;
            setAutoBillingEnabled(newValue);
        } catch (error) {
            alert("Gagal memperbarui pengaturan: " + error.message);
        } finally {
            setTogglingAutoBilling(false);
        }
    };

    const fetchTagihan = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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

            const { data: penyewaList, error } = await supabase
                .from("penyewa")
                .select("*, kamar(nomor, harga, kos(user_id))");

            if (error) throw error;

            if (!penyewaList || penyewaList.length === 0) {
                alert("Belum ada penyewa!");
                setGenerating(false);
                return;
            }

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
        setSettleLoading(true);
        try {
            const { error } = await supabase
                .from("tagihan")
                .update({ status: "lunas" })
                .eq("id", selectedTagihan.id);

            if (error) throw error;
            setShowPaymentModal(false);
            fetchTagihan();
        } catch (error) {
            alert("Gagal memproses pembayaran: " + error.message);
        } finally {
            setSettleLoading(false);
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
            <style jsx global>{`
                @media print {
                    nav, sidebar, .lg\\:pb-0, .pb-24, button, .flex, .bg-\\[\\#1e293b\\], .border, select, .p-1, .modal-header, .modal-footer {
                        display: none !important;
                    }
                    .modal-overlay {
                        background: transparent !important;
                        backdrop-filter: none !important;
                        padding: 0 !important;
                        position: relative !important;
                        z-index: auto !important;
                    }
                    .modal-box {
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                    .modal-content {
                        max-height: none !important;
                        padding: 0 !important;
                    }
                    .print-only {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
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

            {/* Generate Section */}
            {activeTab === "belum" && (
                <div className="bg-[#1e293b]/50 border border-[#334155]/50 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 pb-6 border-b border-[#334155]/50">
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-1">Otomatisasi Tagihan</h3>
                            <p className="text-xs text-slate-400">Sistem akan membuat tagihan baru otomatis setiap tanggal 1.</p>
                        </div>
                        <button
                            onClick={handleToggleAutoBilling}
                            disabled={togglingAutoBilling}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoBillingEnabled ? "bg-indigo-500" : "bg-slate-700"}`}
                        >
                            <span
                                className={`${autoBillingEnabled ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-4">Generate Tagihan Manual</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={selectedBulan}
                            onChange={(e) => setSelectedBulan(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="">Pilih Bulan</option>
                            {BULAN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                        >
                            {generating ? (
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            )}
                            Generate Tagihan
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
                                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                    title="Kirim Pengingat WA"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                </button>
                            )}
                            {row.status === "lunas" && (
                                <button
                                    onClick={() => handleShowReceipt(row)}
                                    className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
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
                title="Selesaikan Pembayaran"
                size="sm"
                footer={(
                    <>
                        <button onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all font-medium">
                            Batal
                        </button>
                        <button
                            onClick={handleSettlePayment}
                            disabled={settleLoading}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {settleLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            Lunas Sekarang
                        </button>
                    </>
                )}
            >
                {selectedTagihan && (
                    <div className="space-y-6">
                        <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-700/50">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Penyewa</span>
                                    <span className="text-white font-semibold">{selectedTagihan.penyewa?.nama}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Bulan Tagihan</span>
                                    <span className="text-white font-semibold">{selectedTagihan.bulan}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Total Bayar</span>
                                    <span className="text-indigo-400 text-2xl font-black">Rp {formatRupiah(selectedTagihan.jumlah)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => sendWhatsApp(selectedTagihan)}
                            className="w-full py-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] font-bold flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                            Kirim Pengingat WhatsApp
                        </button>
                    </div>
                )}
            </Modal>

            {/* Receipt Modal */}
            <Modal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                title="Kwitansi Pembayaran"
                footer={(
                    <>
                        <button onClick={() => setShowReceiptModal(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all">
                            Tutup
                        </button>
                        <button
                            onClick={handlePrintReceipt}
                            className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Cetak Kwitansi
                        </button>
                    </>
                )}
            >
                {selectedReceipt && (
                    <div className="space-y-6">
                        <div id="receipt-content" className="receipt-box bg-white text-slate-900 rounded-2xl p-8 shadow-inner font-sans border border-slate-200">
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter italic">SmartKos</h2>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-none">{selectedReceipt.penyewa?.kamar?.kos?.nama_kos}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-sm font-black uppercase leading-none mb-1">Kwitansi</h3>
                                    <p className="text-[10px] text-slate-400 font-mono">#{selectedReceipt.id.toString().slice(-8).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="space-y-5 text-sm">
                                <div className="flex border-b border-slate-100 pb-2">
                                    <span className="w-32 text-slate-400 text-xs font-bold uppercase italic">Penyewa</span>
                                    <span className="font-bold border-b border-slate-900 flex-1 px-2">{selectedReceipt.penyewa?.nama}</span>
                                </div>
                                <div className="flex border-b border-slate-100 pb-2">
                                    <span className="w-32 text-slate-400 text-xs font-bold uppercase italic">Jumlah</span>
                                    <span className="font-bold border-b border-slate-900 flex-1 px-2">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                </div>
                                <div className="flex border-b border-slate-100 pb-2">
                                    <span className="w-32 text-slate-400 text-xs font-bold uppercase italic">Untuk</span>
                                    <span className="font-bold border-b border-slate-900 flex-1 px-2 italic">Sewa Kamar {selectedReceipt.penyewa?.kamar?.nomor} ({selectedReceipt.bulan})</span>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-between items-end">
                                <div className="bg-slate-900 text-white px-6 py-3 rounded-xl italic font-black text-xl skew-x-[-12deg] shadow-lg shadow-slate-400/50">
                                    <span className="inline-block skew-x-[12deg]">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-8">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <div className="w-24 border-b border-slate-900 mx-auto"></div>
                                    <p className="text-[10px] text-slate-900 font-black uppercase mt-1">Pemilik Kos</p>
                                </div>
                            </div>
                        </div>

                        <div className="print-only">
                            <div className="p-12 bg-white min-h-[400px]">
                                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4 mb-8">
                                    <div>
                                        <h2 className="text-4xl font-black uppercase italic tracking-tighter">SmartKos</h2>
                                        <p className="text-sm font-bold uppercase tracking-widest text-slate-600">{selectedReceipt.penyewa?.kamar?.kos?.nama_kos}</p>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-2xl font-black uppercase">Bukti Pembayaran</h3>
                                        <p className="text-sm font-mono text-slate-400">NO: {selectedReceipt.id.toString().slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="space-y-8 text-xl py-10">
                                    <div className="flex border-b-2 border-slate-100 pb-2">
                                        <span className="w-56 text-slate-400 font-black uppercase italic text-sm">Sudah Terima Dari:</span>
                                        <span className="font-black border-b-2 border-slate-900 flex-1 px-4 text-3xl">{selectedReceipt.penyewa?.nama}</span>
                                    </div>
                                    <div className="flex border-b-2 border-slate-100 pb-2">
                                        <span className="w-56 text-slate-400 font-black uppercase italic text-sm">Sejumlah Uang:</span>
                                        <span className="font-black border-b-2 border-slate-900 flex-1 px-4 text-3xl italic underline underline-offset-8">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                    </div>
                                    <div className="flex border-b-2 border-slate-100 pb-2">
                                        <span className="w-56 text-slate-400 font-black uppercase italic text-sm">Guna Pembayaran:</span>
                                        <span className="font-black border-b-2 border-slate-900 flex-1 px-4 text-2xl">SEWA KAMAR {selectedReceipt.penyewa?.kamar?.nomor} PERIODE {selectedReceipt.bulan.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="mt-24 flex justify-between items-end">
                                    <div className="bg-slate-900 text-white px-12 py-6 rounded-2xl italic font-black text-4xl skew-x-[-12deg]">
                                        <span className="inline-block skew-x-[12deg]">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                    </div>
                                    <div className="text-right min-w-[300px]">
                                        <p className="mb-20 font-black uppercase text-lg text-slate-600">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <div className="w-full border-b-4 border-slate-900"></div>
                                        <p className="font-black uppercase mt-4 text-xl">LUNAS - PENGELOLA KOS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
