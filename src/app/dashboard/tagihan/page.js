"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatRupiah, replacePlaceholders, generateWhatsAppLink } from "@/lib/whatsapp";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { useKos } from "@/context/KosContext";

const BULAN_OPTIONS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function TagihanPage() {
    const { selectedKosId } = useKos();
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
    const [receiptConfig, setReceiptConfig] = useState(null);
    const [autoBillingEnabled, setAutoBillingEnabled] = useState(false);
    const [togglingAutoBilling, setTogglingAutoBilling] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchTagihan();
        fetchTemplate();
        fetchSettings();
    }, [selectedKosId]);


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
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from("tagihan")
                .select("*, penyewa!inner(id, nama, no_hp, jatuh_tempo, kamar!inner(nomor, harga, kos!inner(id, nama_kos)))")
                .order("created_at", { ascending: false });

            if (selectedKosId !== "all") {
                query = query.eq("penyewa.kamar.kos_id", selectedKosId);
            }

            const { data, error } = await query;

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

            let penyewaQuery = supabase
                .from("penyewa")
                .select("*, kamar!inner(nomor, harga, kos!inner(user_id))");

            if (selectedKosId !== "all") {
                penyewaQuery = penyewaQuery.eq("kamar.kos_id", selectedKosId);
            }

            const { data: penyewaList, error } = await penyewaQuery;

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

    const fetchReceiptConfig = async (kosId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Try specific kos template first
            const { data: specificData } = await supabase
                .from("receipt_templates")
                .select("*")
                .eq("user_id", user.id)
                .eq("kos_id", kosId)
                .maybeSingle();

            if (specificData) {
                setReceiptConfig(specificData);
                return;
            }

            // Fallback to global template (kos_id IS NULL)
            const { data: globalData } = await supabase
                .from("receipt_templates")
                .select("*")
                .eq("user_id", user.id)
                .is("kos_id", null)
                .maybeSingle();

            setReceiptConfig(globalData);
        } catch (error) {
            console.error("Error fetching receipt config:", error);
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
            handleShowReceipt(row);
        }
    };

    const handleShowReceipt = (row) => {
        setSelectedReceipt(row);
        fetchReceiptConfig(row.penyewa?.kamar?.kos?.id);
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

    const sendWhatsAppFonnte = async (tagihan) => {
        const { data: templateData } = await supabase
            .from("wa_templates")
            .select("fonnte_token")
            .eq("user_id", tagihan.penyewa.kamar.kos.user_id)
            .single();

        if (!templateData || !templateData.fonnte_token) {
            alert("Token Fonnte belum diatur. Silakan atur di Pengaturan WhatsApp.");
            return;
        }

        const data = {
            nama: tagihan.penyewa.nama,
            bulan: tagihan.bulan,
            jumlah: tagihan.jumlah,
            kamar: tagihan.penyewa.kamar.nomor,
            jatuh_tempo: tagihan.penyewa.jatuh_tempo,
        };
        const message = replacePlaceholders(waTemplate, data);

        try {
            const formData = new FormData();
            formData.append("target", tagihan.penyewa.no_hp);
            formData.append("message", message);
            formData.append("delay", "2");

            const res = await fetch("/api/whatsapp/send", {
                method: "POST",
                headers: { "Authorization": templateData.fonnte_token },
                body: formData
            });

            const result = await res.json();
            if (result.status) {
                await supabase.from("tagihan").update({ tanggal_kirim_wa: new Date().toISOString() }).eq("id", tagihan.id);
                alert("Pesan WhatsApp berhasil dikirim otomatis via Fonnte!");
                fetchTagihan();
            } else {
                alert("Gagal mengirim pesan: " + (result.reason || "Unknown error"));
            }
        } catch (error) {
            console.error("Error sending Fonnte WA:", error);
            alert("Terjadi kesalahan saat mengirim pesan.");
        }
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
                        <div className="flex gap-2 w-full mt-4">
                            <button
                                onClick={() => sendWhatsAppFonnte(selectedTagihan)}
                                className="flex-1 py-4 rounded-2xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#20b858] transition-all"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                Kirim Otomatis (Fonnte)
                            </button>
                            <button
                                onClick={() => sendWhatsApp(selectedTagihan)}
                                className="flex-1 py-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] font-bold flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Buka via WA.me
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
                size="md"
                footer={(
                    <>
                        <button onClick={() => setShowReceiptModal(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all">
                            Tutup
                        </button>
                        <button
                            onClick={handlePrintReceipt}
                            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
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
                        {/* On-screen Preview */}
                        <div id="receipt-content" className="receipt-box bg-white text-slate-900 rounded-3xl p-8 shadow-inner font-serif relative overflow-hidden border border-slate-200">
                            {/* Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-45 font-black text-6xl pointer-events-none select-none tracking-widest">
                                SMARTKOS
                            </div>

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="text-center border-b-2 border-slate-900/10 pb-6 mb-8">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 text-slate-900">
                                        {receiptConfig?.nama_bisnis || selectedReceipt.penyewa?.kamar?.kos?.nama_kos || "BUKTI PEMBAYARAN"}
                                    </h2>
                                    {receiptConfig?.alamat_bisnis && (
                                        <p className="text-[10px] leading-relaxed opacity-70 italic max-w-xs mx-auto mb-1">
                                            {receiptConfig.alamat_bisnis}
                                        </p>
                                    )}
                                    <p className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">
                                        {receiptConfig?.kontak_bisnis || "KONTAK: -"}
                                    </p>
                                </div>

                                {/* Body */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b border-slate-900/5 pb-4">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Kwitansi</p>
                                            <h3 className="text-base font-black font-mono">#{selectedReceipt.id.toString().slice(-8).toUpperCase()}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                                            <p className="text-xs font-bold italic">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 py-2">
                                        <div className="flex justify-between items-center text-sm border-b border-slate-50 border-dotted pb-2">
                                            <span className="text-slate-500 italic">Sudah Terima Dari</span>
                                            <span className="font-black text-slate-900">{selectedReceipt.penyewa?.nama}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-slate-50 border-dotted pb-2">
                                            <span className="text-slate-500 italic">Properti / Kamar</span>
                                            <span className="font-black text-slate-900">{selectedReceipt.penyewa?.kamar?.kos?.nama_kos} - Kamar {selectedReceipt.penyewa?.kamar?.nomor}</span>
                                        </div>
                                        <div className="flex justify-between items-start text-sm border-b border-slate-50 border-dotted pb-2">
                                            <span className="text-slate-500 italic">Untuk Pembayaran</span>
                                            <span className="font-black text-slate-900 text-right max-w-[180px]">Sewa Kamar Periode {selectedReceipt.bulan}</span>
                                        </div>
                                    </div>

                                    {/* Total Container */}
                                    <div className="bg-slate-50 rounded-2xl p-5 flex justify-between items-center border border-slate-100 mt-8">
                                        <span className="font-black uppercase tracking-widest text-xs text-slate-400">Total Nominal</span>
                                        <span className="text-2xl font-black text-slate-900">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                    </div>
                                </div>

                                {/* Footer / Signature */}
                                <div className="mt-12 text-center relative">
                                    <p className="text-[10px] italic text-slate-500 px-8 leading-relaxed mb-8">
                                        "{receiptConfig?.pesan_tambahan || "Terima kasih telah mempercayakan hunian Anda kepada kami."}"
                                    </p>

                                    <div className="flex justify-end pr-8">
                                        <div className="text-center">
                                            <div className="w-32 border-b-2 border-slate-900 mb-2 mt-4"></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Pengelola Kos</p>
                                        </div>
                                    </div>

                                    {/* Stamp/Paid Indicator */}
                                    <div className="absolute left-4 bottom-2 inline-block px-4 py-1.5 border-4 border-emerald-500/30 text-emerald-500 text-[10px] font-black rounded-lg rotate-[-15deg] uppercase tracking-widest">
                                        Lunas / Paid
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Print Only Version (Professional High-Res) */}
                        <div className="print-only">
                            <div className="p-16 bg-white min-h-[500px] text-slate-950 font-serif">
                                <div className="flex justify-between items-start border-b-[3px] border-slate-950 pb-6 mb-10">
                                    <div>
                                        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">
                                            {receiptConfig?.nama_bisnis || selectedReceipt.penyewa?.kamar?.kos?.nama_kos}
                                        </h2>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-1">{receiptConfig?.alamat_bisnis}</p>
                                        <p className="text-xs font-black text-indigo-700">{receiptConfig?.kontak_bisnis}</p>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-2xl font-black uppercase tracking-widest mb-2">Bukti Bayar</h3>
                                        <p className="text-sm font-mono text-slate-400">NO: {selectedReceipt.id.toString().slice(-12).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="space-y-10 text-2xl py-8">
                                    <div className="flex items-end gap-6">
                                        <span className="text-sm font-black uppercase italic text-slate-400 min-w-[150px]">Diterima Dari</span>
                                        <span className="border-b-2 border-slate-950 flex-1 px-4 text-4xl font-bold uppercase pb-2">{selectedReceipt.penyewa?.nama}</span>
                                    </div>
                                    <div className="flex items-end gap-6">
                                        <span className="text-sm font-black uppercase italic text-slate-400 min-w-[150px]">Sejumlah Uang</span>
                                        <span className="border-b-2 border-slate-950 flex-1 px-4 text-4xl font-black italic pb-2">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                    </div>
                                    <div className="flex items-end gap-6">
                                        <span className="text-sm font-black uppercase italic text-slate-400 min-w-[150px]">Keterangan</span>
                                        <span className="border-b-2 border-slate-950 flex-1 px-4 text-2xl font-bold pb-2">PEMBAYARAN SEWA KAMAR {selectedReceipt.penyewa?.kamar?.nomor} - {selectedReceipt.bulan.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="mt-20 flex justify-between items-center">
                                    <div className="bg-slate-950 text-white px-10 py-6 rounded-2xl italic font-black text-5xl skew-x-[-10deg] shadow-2xl">
                                        <span className="inline-block skew-x-[10deg]">Rp {formatRupiah(selectedReceipt.jumlah)}</span>
                                    </div>
                                    <div className="text-center min-w-[250px]">
                                        <p className="mb-24 font-bold text-lg text-slate-600 italic">
                                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                        <div className="w-full border-b-[3px] border-slate-950 mb-3"></div>
                                        <p className="font-black uppercase tracking-widest text-sm">Authorized Signature</p>
                                    </div>
                                </div>

                                <div className="mt-16 text-center border-t border-slate-100 pt-8">
                                    <p className="text-sm italic opacity-40">
                                        "{receiptConfig?.pesan_tambahan || "Terima kasih atas pembayaran Anda. Simpan bukti ini sebagai referensi resmi."}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
