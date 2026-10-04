"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatRupiah, replacePlaceholders, generateWhatsAppLink, getTemplateForStage } from "@/lib/whatsapp";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import KwitansiTemplate from "@/components/KwitansiTemplate";
import { printReceiptElement } from "@/lib/printReceipt";
import { useKos } from "@/context/KosContext";

const getBulanOptions = () => {
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const currentYear = new Date().getFullYear();
    const options = [];
    months.forEach((m) => {
        options.push(`${m} ${currentYear}`);
    });
    months.forEach((m) => {
        options.push(`${m} ${currentYear + 1}`);
    });
    return options;
};

const BULAN_OPTIONS = getBulanOptions();

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
    const [showLunasWAModal, setShowLunasWAModal] = useState(false);
    const [selectedLunasTagihan, setSelectedLunasTagihan] = useState(null);
    const [selectedReminderStage, setSelectedReminderStage] = useState("h-3");
    const [sendingFonnte, setSendingFonnte] = useState(false);
    
    // States for Generate Tagihan
    const [penyewaList, setPenyewaList] = useState([]);
    const [selectedPenyewa, setSelectedPenyewa] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    useEffect(() => {
        fetchTagihan();
        fetchTemplate();
        fetchSettings();
        fetchPenyewaList();
    }, [selectedKosId]);

    const fetchPenyewaList = async () => {
        try {
            let query = supabase.from("penyewa").select("id, nama, kamar!inner(kos_id)").order("nama");
            if (selectedKosId !== "all") {
                query = query.eq("kamar.kos_id", selectedKosId);
            }
            const { data } = await query;
            if (data) setPenyewaList(data);
        } catch (error) {
            console.error("Error fetching penyewa:", error);
        }
    };


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
                .select("id, bulan, jumlah, status, tanggal_kirim_wa, created_at, penyewa_id, penyewa!inner(id, nama, no_hp, jatuh_tempo, kamar!inner(nomor, harga, kos!inner(id, nama_kos, user_id)))")
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

            const { data: fetchPenyewa, error } = await penyewaQuery;

            if (error) throw error;

            if (!fetchPenyewa || fetchPenyewa.length === 0) {
                alert("Belum ada penyewa!");
                setGenerating(false);
                return;
            }

            // Filter penyewa based on selection
            const targetPenyewaList = selectedPenyewa === "all" 
                ? fetchPenyewa 
                : fetchPenyewa.filter(p => p.id === selectedPenyewa);

            if (targetPenyewaList.length === 0) {
                alert("Penyewa yang dipilih tidak ditemukan.");
                setGenerating(false);
                return;
            }

            const existingIds = tagihanList
                .filter(t => t.bulan === selectedBulan)
                .map(t => t.penyewa_id);

            const newTagihan = targetPenyewaList
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
            const today = new Date().getDate();
            const jt = parseInt(row.penyewa?.jatuh_tempo, 10) || 10;
            if (today > jt) {
                setSelectedReminderStage("overdue");
            } else if (today === jt) {
                setSelectedReminderStage("hari-h");
            } else {
                setSelectedReminderStage("h-3");
            }
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

    const handleOpenLunasWA = (row) => {
        setSelectedLunasTagihan(row);
        fetchReceiptConfig(row.penyewa?.kamar?.kos?.id);
        setShowLunasWAModal(true);
    };

    const sendWhatsAppLunas = async (tagihan, type = "standard") => {
        if (!tagihan) return;
        const rawId = tagihan.id.toString();
        const noKwitansi = `#KW-${rawId.slice(-8).toUpperCase()}`;
        const formattedJumlah = typeof tagihan.jumlah === "number" ? tagihan.jumlah.toLocaleString("id-ID") : tagihan.jumlah;
        const kosName = tagihan.penyewa?.kamar?.kos?.nama_kos || "SmartKos";
        const nomorKamar = tagihan.penyewa?.kamar?.nomor || "-";
        const namaPenyewa = tagihan.penyewa?.nama || "Penyewa";
        const bulan = tagihan.bulan;
        const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let message = "";
        if (type === "kwitansi_text") {
            message = `*BUKTI PEMBAYARAN / KWITANSI RESMI*\n` +
                `-----------------------------------\n` +
                `*${receiptConfig?.nama_bisnis || kosName}*\n` +
                `${receiptConfig?.alamat_bisnis ? receiptConfig.alamat_bisnis + '\n' : ''}` +
                `-----------------------------------\n` +
                `No. Kwitansi : ${noKwitansi}\n` +
                `Tanggal     : ${tgl}\n` +
                `Nama        : ${namaPenyewa}\n` +
                `Unit/Kamar  : ${kosName} - Kamar ${nomorKamar}\n` +
                `Periode     : ${bulan}\n` +
                `Jumlah      : Rp ${formattedJumlah}\n` +
                `Status      : *LUNAS / PAID* ✅\n` +
                `-----------------------------------\n` +
                `_${receiptConfig?.pesan_tambahan || "Terima kasih telah mempercayakan hunian Anda kepada kami."}_\n\n` +
                `Dokumen kwitansi elektronik resmi SmartKos System.`;
        } else {
            message = `Halo ${namaPenyewa},\n\n` +
                `Terima kasih! Pembayaran sewa kos bulan *${bulan}* untuk *Kamar ${nomorKamar} (${kosName})* sebesar *Rp ${formattedJumlah}* telah kami terima dan terkonfirmasi *LUNAS* ✅.\n\n` +
                `Nomor Bukti Kwitansi: ${noKwitansi}\n` +
                `Tanggal: ${tgl}\n\n` +
                `_${receiptConfig?.pesan_tambahan || "Terima kasih telah melakukan pembayaran tepat waktu. Semoga hari Anda menyenangkan!"}_ 🙏`;
        }

        const link = generateWhatsAppLink(tagihan.penyewa.no_hp, message);
        await supabase.from("tagihan").update({ tanggal_kirim_wa: new Date().toISOString() }).eq("id", tagihan.id);
        window.open(link, "_blank");
        fetchTagihan();
    };

    const sendWhatsAppLunasFonnte = async (tagihan, type = "standard") => {
        if (!tagihan) return;
        const kosUserId = tagihan.penyewa.kamar.kos.user_id;

        const { data: userData } = await supabase
            .from("users")
            .select("wa_api_key")
            .eq("id", kosUserId)
            .single();

        if (!userData || !userData.wa_api_key) {
            alert("Token Fonnte belum diatur. Silakan atur di Pengaturan WhatsApp.");
            return;
        }

        const rawId = tagihan.id.toString();
        const noKwitansi = `#KW-${rawId.slice(-8).toUpperCase()}`;
        const formattedJumlah = typeof tagihan.jumlah === "number" ? tagihan.jumlah.toLocaleString("id-ID") : tagihan.jumlah;
        const kosName = tagihan.penyewa?.kamar?.kos?.nama_kos || "SmartKos";
        const nomorKamar = tagihan.penyewa?.kamar?.nomor || "-";
        const namaPenyewa = tagihan.penyewa?.nama || "Penyewa";
        const bulan = tagihan.bulan;
        const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let message = "";
        if (type === "kwitansi_text") {
            message = `*BUKTI PEMBAYARAN / KWITANSI RESMI*\n` +
                `-----------------------------------\n` +
                `*${receiptConfig?.nama_bisnis || kosName}*\n` +
                `${receiptConfig?.alamat_bisnis ? receiptConfig.alamat_bisnis + '\n' : ''}` +
                `-----------------------------------\n` +
                `No. Kwitansi : ${noKwitansi}\n` +
                `Tanggal     : ${tgl}\n` +
                `Nama        : ${namaPenyewa}\n` +
                `Unit/Kamar  : ${kosName} - Kamar ${nomorKamar}\n` +
                `Periode     : ${bulan}\n` +
                `Jumlah      : Rp ${formattedJumlah}\n` +
                `Status      : *LUNAS / PAID* ✅\n` +
                `-----------------------------------\n` +
                `_${receiptConfig?.pesan_tambahan || "Terima kasih telah mempercayakan hunian Anda kepada kami."}_\n\n` +
                `Dokumen kwitansi elektronik resmi SmartKos System.`;
        } else {
            message = `Halo ${namaPenyewa},\n\n` +
                `Terima kasih! Pembayaran sewa kos bulan *${bulan}* untuk *Kamar ${nomorKamar} (${kosName})* sebesar *Rp ${formattedJumlah}* telah kami terima dan terkonfirmasi *LUNAS* ✅.\n\n` +
                `Nomor Bukti Kwitansi: ${noKwitansi}\n` +
                `Tanggal: ${tgl}\n\n` +
                `_${receiptConfig?.pesan_tambahan || "Terima kasih telah melakukan pembayaran tepat waktu. Semoga hari Anda menyenangkan!"}_ 🙏`;
        }

        try {
            const response = await fetch("https://api.fonnte.com/send", {
                method: "POST",
                headers: {
                    "Authorization": userData.wa_api_key,
                },
                body: new URLSearchParams({
                    target: tagihan.penyewa.no_hp,
                    message: message,
                }),
            });
            const result = await response.json();
            if (result.status) {
                await supabase.from("tagihan").update({ tanggal_kirim_wa: new Date().toISOString() }).eq("id", tagihan.id);
                alert("Konfirmasi lunas berhasil dikirim via Fonnte!");
                fetchTagihan();
            } else {
                alert("Gagal mengirim WA via Fonnte: " + result.reason);
            }
        } catch (error) {
            alert("Error sending WA via Fonnte: " + error.message);
        }
    };

    const handlePrintReceipt = () => {
        printReceiptElement("printable-receipt");
    };

    const sendWhatsAppWithStage = async (tagihan, stage = "normal") => {
        if (!tagihan) return;
        const data = {
            nama: tagihan.penyewa?.nama,
            bulan: tagihan.bulan,
            jumlah: tagihan.jumlah,
            kamar: tagihan.penyewa?.kamar?.nomor,
            jatuh_tempo: tagihan.penyewa?.jatuh_tempo,
        };

        const templateText = getTemplateForStage(waTemplate, stage);
        const message = replacePlaceholders(templateText, data);
        const link = generateWhatsAppLink(tagihan.penyewa?.no_hp, message);

        await supabase.from("tagihan").update({ tanggal_kirim_wa: new Date().toISOString() }).eq("id", tagihan.id);
        window.open(link, "_blank");
        fetchTagihan();
    };

    const sendWhatsApp = (tagihan) => sendWhatsAppWithStage(tagihan, "normal");

    const sendWhatsAppFonnte = async (tagihan, stage = "normal") => {
        if (!tagihan) return;
        const kosUserId = tagihan.penyewa?.kamar?.kos?.user_id;
        setSendingFonnte(true);

        try {
            const { data: userData } = await supabase
                .from("users")
                .select("wa_api_key")
                .eq("id", kosUserId)
                .single();

            if (!userData || !userData.wa_api_key) {
                alert("Token Fonnte belum diatur. Silakan atur di Pengaturan WhatsApp.");
                return;
            }

            const data = {
                nama: tagihan.penyewa?.nama,
                bulan: tagihan.bulan,
                jumlah: tagihan.jumlah,
                kamar: tagihan.penyewa?.kamar?.nomor,
                jatuh_tempo: tagihan.penyewa?.jatuh_tempo,
            };

            const templateText = getTemplateForStage(waTemplate, stage);
            const message = replacePlaceholders(templateText, data);

            let targetNumber = tagihan.penyewa?.no_hp || "";
            targetNumber = targetNumber.replace(/[\s\-\+]/g, "");
            if (targetNumber.startsWith("08")) {
                targetNumber = "62" + targetNumber.substring(1);
            }

            const formData = new FormData();
            formData.append("target", targetNumber);
            formData.append("message", message);
            formData.append("delay", "2");

            const res = await fetch("/api/whatsapp/send", {
                method: "POST",
                headers: { "Authorization": userData.wa_api_key },
                body: formData
            });

            const result = await res.json();
            if (result.status) {
                await supabase.from("tagihan").update({ tanggal_kirim_wa: new Date().toISOString() }).eq("id", tagihan.id);
                alert(`Pesan pengingat (${stage.toUpperCase()}) berhasil dikirim via Fonnte!`);
                fetchTagihan();
            } else {
                alert("Gagal mengirim pesan via Fonnte: " + (result.reason || "Unknown error"));
            }
        } catch (error) {
            console.error("Error sending Fonnte WA:", error);
            alert("Terjadi kesalahan saat mengirim pesan via Fonnte.");
        } finally {
            setSendingFonnte(false);
        }
    };

    const filteredData = tagihanList.filter(t => {
        if (t.status !== activeTab) return false;
        if (!searchQuery) return true;
        
        const q = searchQuery.toLowerCase();
        const namaPenyewa = t.penyewa?.nama?.toLowerCase() || "";
        const kamar = t.penyewa?.kamar?.nomor?.toString().toLowerCase() || "";
        const kos = t.penyewa?.kamar?.kos?.nama_kos?.toLowerCase() || "";
        const bulan = t.bulan?.toLowerCase() || "";
        
        return namaPenyewa.includes(q) || kamar.includes(q) || kos.includes(q) || bulan.includes(q);
    });

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

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex gap-2 p-1 bg-[#1e293b] rounded-xl w-fit">
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

                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama, kamar, bulan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e293b]/80 border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                </div>
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
                    <div className="flex flex-col md:flex-row gap-3">
                        <select
                            value={selectedPenyewa}
                            onChange={(e) => setSelectedPenyewa(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all md:w-48"
                        >
                            <option value="all">Semua Penyewa</option>
                            {penyewaList.map(p => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                        <select
                            value={selectedBulan}
                            onChange={(e) => setSelectedBulan(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all md:w-44"
                        >
                            <option value="">Pilih Bulan</option>
                            {BULAN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                const currentMonthStr = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
                                setSelectedBulan(currentMonthStr);
                            }}
                            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 transition-all whitespace-nowrap"
                        >
                            ⚡ Bulan Ini
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
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
                                <>
                                    <button
                                        onClick={() => handleDoubleClick(row)}
                                        className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                                        title="Selesaikan Pembayaran"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                    <button
                                        onClick={() => sendWhatsApp(row)}
                                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                        title="Kirim Pengingat WA"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                    </button>
                                </>
                            )}
                            {row.status === "lunas" && (
                                <>
                                    <button
                                        onClick={() => handleShowReceipt(row)}
                                        className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                                        title="Lihat / Cetak Kwitansi"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleOpenLunasWA(row)}
                                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                        title="Kirim Konfirmasi WA Lunas"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                        </svg>
                                    </button>
                                </>
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
                        <div className="space-y-3 mt-4">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Kirim Pengingat Tagihan (WhatsApp)
                            </label>

                            {/* Pilihan Tahap Pengingat */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReminderStage("h-3")}
                                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border flex items-center justify-center gap-1.5 ${
                                        selectedReminderStage === "h-3"
                                            ? "bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20"
                                            : "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                                    }`}
                                    title="Pilih tahap pengingat H-3 sebelum jatuh tempo"
                                >
                                    <span>🔔</span>
                                    <span>Pengingat H-3</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedReminderStage("hari-h")}
                                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border flex items-center justify-center gap-1.5 ${
                                        selectedReminderStage === "hari-h"
                                            ? "bg-indigo-500/30 border-indigo-400 text-indigo-200 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20"
                                            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                                    }`}
                                    title="Pilih tahap pengingat hari-H jatuh tempo"
                                >
                                    <span>📢</span>
                                    <span>Pengingat Hari-H</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedReminderStage("overdue")}
                                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border flex items-center justify-center gap-1.5 ${
                                        selectedReminderStage === "overdue"
                                            ? "bg-rose-500/30 border-rose-400 text-rose-200 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20"
                                            : "bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20"
                                    }`}
                                    title="Pilih tahap teguran tagihan menunggak"
                                >
                                    <span>⚠️</span>
                                    <span>Menunggak</span>
                                </button>
                            </div>

                            {/* Preview Pesan yang Dipilih */}
                            <div className="bg-[#0f172a] rounded-xl p-3 border border-slate-700/60 text-xs text-slate-300">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                                    <span>PRATINJAU PESAN ({
                                        selectedReminderStage === "h-3" ? "H-3 SEBELUM JATUH TEMPO" :
                                        selectedReminderStage === "hari-h" ? "HARI-H JATUH TEMPO" : "TAGIHAN MENUNGGAK"
                                    }):</span>
                                </div>
                                <p className="italic text-slate-300 leading-relaxed text-[11px]">
                                    "{replacePlaceholders(getTemplateForStage(waTemplate, selectedReminderStage), {
                                        nama: selectedTagihan.penyewa?.nama,
                                        bulan: selectedTagihan.bulan,
                                        jumlah: selectedTagihan.jumlah,
                                        kamar: selectedTagihan.penyewa?.kamar?.nomor,
                                        jatuh_tempo: selectedTagihan.penyewa?.jatuh_tempo,
                                    })}"
                                </p>
                            </div>

                            {/* Tombol Eksekusi Pengiriman */}
                            <div className="flex gap-2 w-full pt-1">
                                <button
                                    type="button"
                                    onClick={() => sendWhatsAppFonnte(selectedTagihan, selectedReminderStage)}
                                    disabled={sendingFonnte}
                                    className="flex-1 py-3 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#20b858] transition-all shadow-md shadow-[#25D366]/20 disabled:opacity-50"
                                >
                                    {sendingFonnte ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Mengirim Fonnte...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                            <span>Kirim Otomatis (Fonnte)</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => sendWhatsAppWithStage(selectedTagihan, selectedReminderStage)}
                                    className="flex-1 py-3 px-3 rounded-xl bg-[#25D366]/10 text-[#25D366] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all border border-[#25D366]/30"
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    <span>Buka WA.me</span>
                                </button>
                            </div>
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
                    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                        <button
                            onClick={() => sendWhatsAppLunas(selectedReceipt, "standard")}
                            className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#20b858] transition-all shadow-md"
                            title="Kirim kata-kata konfirmasi lunas via WhatsApp"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                            Kirim WA Konfirmasi
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowReceiptModal(false)} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-semibold">
                                Tutup
                            </button>
                            <button
                                onClick={handlePrintReceipt}
                                className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Cetak Kwitansi
                            </button>
                        </div>
                    </div>
                )}
            >
                {selectedReceipt && (
                    <div className="py-2">
                        <KwitansiTemplate
                            config={receiptConfig}
                            data={selectedReceipt}
                        />
                    </div>
                )}
            </Modal>

            {/* Lunas WhatsApp Confirmation Choice Modal */}
            <Modal
                isOpen={showLunasWAModal}
                onClose={() => setShowLunasWAModal(false)}
                title="Kirim Konfirmasi WA Pembayaran Lunas"
                size="md"
                footer={(
                    <button onClick={() => setShowLunasWAModal(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-semibold">
                        Tutup
                    </button>
                )}
            >
                {selectedLunasTagihan && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
                            <div className="flex justify-between text-slate-300">
                                <span>Penyewa:</span>
                                <span className="font-bold text-white">{selectedLunasTagihan.penyewa?.nama}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Kamar:</span>
                                <span className="font-bold text-white">{selectedLunasTagihan.penyewa?.kamar?.kos?.nama_kos} — Kamar {selectedLunasTagihan.penyewa?.kamar?.nomor}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Periode Tagihan:</span>
                                <span className="font-semibold text-indigo-300">{selectedLunasTagihan.bulan}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Total Nominal:</span>
                                <span className="font-black text-emerald-400">Rp {typeof selectedLunasTagihan.jumlah === "number" ? selectedLunasTagihan.jumlah.toLocaleString("id-ID") : selectedLunasTagihan.jumlah}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilih Opsi Pesan WhatsApp:</p>

                            {/* Option 1: Standard Words Confirmation */}
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">1. Kata-kata Konfirmasi Pembayaran</h4>
                                </div>
                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                    "Halo {selectedLunasTagihan.penyewa?.nama}, terima kasih! Pembayaran sewa kos bulan {selectedLunasTagihan.bulan} sebesar Rp {typeof selectedLunasTagihan.jumlah === "number" ? selectedLunasTagihan.jumlah.toLocaleString("id-ID") : selectedLunasTagihan.jumlah} telah kami terima dan terkonfirmasi LUNAS ✅..."
                                </p>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => {
                                            sendWhatsAppLunas(selectedLunasTagihan, "standard");
                                            setShowLunasWAModal(false);
                                        }}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#20b858] transition-all shadow-md"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                        Buka WA.me
                                    </button>
                                    <button
                                        onClick={() => {
                                            sendWhatsAppLunasFonnte(selectedLunasTagihan, "standard");
                                            setShowLunasWAModal(false);
                                        }}
                                        className="py-2.5 px-3 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold text-xs hover:bg-slate-700 transition-all"
                                    >
                                        Fonnte Otomatis
                                    </button>
                                </div>
                            </div>

                            {/* Option 2: Full Kwitansi Text Breakdown */}
                            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/15 transition-all space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">2. Rincian Kwitansi Resmi (Teks WA)</h4>
                                </div>
                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                    Kirim format kwitansi resmi lengkap (No. Kwitansi, Tanggal, Nama Penyewa, Kamar, Periode, Nominal, Status LUNAS) dalam bentuk teks terstruktur via WhatsApp.
                                </p>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => {
                                            sendWhatsAppLunas(selectedLunasTagihan, "kwitansi_text");
                                            setShowLunasWAModal(false);
                                        }}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-500 transition-all shadow-md"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                        Kirim Kwitansi Teks
                                    </button>
                                    <button
                                        onClick={() => {
                                            sendWhatsAppLunasFonnte(selectedLunasTagihan, "kwitansi_text");
                                            setShowLunasWAModal(false);
                                        }}
                                        className="py-2.5 px-3 rounded-xl bg-slate-800 text-indigo-300 border border-indigo-500/30 font-bold text-xs hover:bg-slate-700 transition-all"
                                    >
                                        Fonnte Otomatis
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
