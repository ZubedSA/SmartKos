"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function BackupPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [currentStats, setCurrentStats] = useState(null);

    // Selected file & restore preview state
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePayload, setFilePayload] = useState(null);
    const [parseError, setParseError] = useState("");
    const [restoreMode, setRestoreMode] = useState("replace"); // 'replace' or 'merge'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }

    const supabase = createClient();

    const fetchStats = async (userId) => {
        try {
            const { data: kosData } = await supabase.from("kos").select("id").eq("user_id", userId);
            const kosIds = (kosData || []).map(k => k.id);

            let kamarCount = 0;
            let penyewaCount = 0;
            let tagihanCount = 0;

            if (kosIds.length > 0) {
                const { data: kamarData } = await supabase.from("kamar").select("id").in("kos_id", kosIds);
                kamarCount = kamarData?.length || 0;
                const kamarIds = (kamarData || []).map(km => km.id);

                if (kamarIds.length > 0) {
                    const { data: penyewaData } = await supabase.from("penyewa").select("id").in("kamar_id", kamarIds);
                    penyewaCount = penyewaData?.length || 0;
                    const penyewaIds = (penyewaData || []).map(p => p.id);

                    if (penyewaIds.length > 0) {
                        const { count } = await supabase.from("tagihan").select("id", { count: "exact" }).in("penyewa_id", penyewaIds);
                        tagihanCount = count || 0;
                    }
                }
            }

            const { count: opsCount } = await supabase.from("operasional").select("id", { count: "exact" }).eq("user_id", userId);

            setCurrentStats({
                totalKos: kosIds.length,
                totalKamar: kamarCount,
                totalPenyewa: penyewaCount,
                totalTagihan: tagihanCount,
                totalOperasional: opsCount || 0
            });
        } catch (err) {
            console.error("Gagal mengambil statistik:", err);
        }
    };

    useEffect(() => {
        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();
                setUser(profile);
                await fetchStats(authUser.id);
            }
            setLoading(false);
        };
        getUser();
    }, []);

    // Handle Backup Download (Export)
    const handleDownloadBackup = async () => {
        if (!user) return;
        setExporting(true);
        setMessage(null);

        try {
            const res = await fetch("/api/backup/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal mengunduh data backup");

            // Format JSON data and create download link
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(data.backupPayload, null, 2)
            )}`;

            const dateStr = new Date().toISOString().split("T")[0];
            const cleanName = (user.name || "User").replace(/[^a-zA-Z0-9]/g, "_");
            const fileName = `SmartKos_Backup_${cleanName}_${dateStr}.json`;

            const downloadAnchor = document.createElement("a");
            downloadAnchor.setAttribute("href", jsonString);
            downloadAnchor.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            setMessage({
                type: "success",
                text: `Backup data berhasil diunduh (${fileName})`
            });
        } catch (err) {
            console.error("Error export:", err);
            setMessage({ type: "error", text: err.message });
        } finally {
            setExporting(false);
        }
    };

    // Handle File Selection for Restore
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        setParseError("");
        setFilePayload(null);
        setSelectedFile(null);
        setMessage(null);

        if (!file) return;

        if (!file.name.endsWith(".json")) {
            setParseError("File harus berformat JSON (.json)");
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);

                if (!parsed.app || parsed.app !== "SmartKos" || !parsed.data) {
                    throw new Error("Format file JSON bukan merupakan backup resmi SmartKos.");
                }

                setFilePayload(parsed);
            } catch (err) {
                setParseError("File JSON tidak valid: " + err.message);
                setFilePayload(null);
            }
        };

        reader.readAsText(file);
    };

    // Trigger Restore API
    const handleExecuteRestore = async () => {
        if (!filePayload || !user) return;

        if (restoreMode === "replace" && confirmText.trim().toLowerCase() !== "restore") {
            alert('Ketik "RESTORE" untuk mengonfirmasi penimpaan data.');
            return;
        }

        setRestoring(true);
        setShowConfirmModal(false);
        setMessage(null);

        try {
            const res = await fetch("/api/backup/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    mode: restoreMode,
                    backupPayload: filePayload
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal melakukan restore");

            setMessage({
                type: "success",
                text: data.message || "Data berhasil dipulihkan dari file backup."
            });

            // Reset file states & refresh stats
            setSelectedFile(null);
            setFilePayload(null);
            setConfirmText("");
            await fetchStats(user.id);
        } catch (err) {
            console.error("Restore error:", err);
            setMessage({ type: "error", text: err.message });
        } finally {
            setRestoring(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center text-slate-400">
                    <svg className="animate-spin w-8 h-8 mx-auto text-indigo-500 mb-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Memuat informasi backup...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 lg:pb-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Keamanan & Cadangan Data
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Backup & Restore Data Kos</h1>
                <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                    Cadangkan seluruh data unit kos, kamar, penyewa, riwayat tagihan, dan operasional Anda dalam bentuk file JSON. Anda dapat memulihkannya kapan saja.
                </p>
            </div>

            {/* Notification Banner */}
            {message && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                    message.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}>
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {message.type === "success" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        )}
                    </svg>
                    <div className="flex-1 text-sm font-medium">{message.text}</div>
                    <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Grid 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* CARD 1: BACKUP (EXPORT) */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Unduh Backup Data</h3>
                                <p className="text-xs text-slate-400">Export seluruh database kos Anda ke file .json</p>
                            </div>
                        </div>

                        {/* Current Data Overview */}
                        <div className="bg-[#0f172a]/60 border border-slate-700/60 rounded-2xl p-4 my-5 space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ringkasan Data Saat Ini</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                                    <span className="block text-lg font-extrabold text-indigo-400">{currentStats?.totalKos || 0}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Kos</span>
                                </div>
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                                    <span className="block text-lg font-extrabold text-indigo-400">{currentStats?.totalKamar || 0}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Kamar</span>
                                </div>
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                                    <span className="block text-lg font-extrabold text-indigo-400">{currentStats?.totalPenyewa || 0}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Penyewa</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                                    <span className="block text-base font-bold text-emerald-400">{currentStats?.totalTagihan || 0}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Tagihan</span>
                                </div>
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                                    <span className="block text-base font-bold text-amber-400">{currentStats?.totalOperasional || 0}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Operasional</span>
                                </div>
                            </div>
                        </div>

                        <ul className="text-xs text-slate-400 space-y-2 mb-6">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Termasuk template WhatsApp & Kwitansi
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Format standar aman untuk migrasi/pemulihan
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={handleDownloadBackup}
                        disabled={exporting}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {exporting ? (
                            <>
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Menyiapkan File Backup...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Unduh Backup Sekarang (.json)</span>
                            </>
                        )}
                    </button>
                </div>

                {/* CARD 2: RESTORE (IMPORT) */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Restore / Pulihkan Data</h3>
                                <p className="text-xs text-slate-400">Unggah file backup .json untuk mengembalikan data</p>
                            </div>
                        </div>

                        {/* File Upload Box */}
                        <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-[#0f172a]/50 rounded-2xl p-6 text-center transition-all group my-4">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-300">
                                    {selectedFile ? selectedFile.name : "Klik atau seret file .json backup ke sini"}
                                </span>
                                <span className="text-[10px] text-slate-500">Mendukung format cadangan SmartKos</span>
                            </div>
                        </div>

                        {parseError && (
                            <p className="text-xs text-red-400 mb-4 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                                ⚠️ {parseError}
                            </p>
                        )}

                        {/* File Preview Card */}
                        {filePayload && (() => {
                            const kosCount = filePayload.summary?.total_kos ?? filePayload.data?.kos?.length ?? 0;
                            const kamarCount = filePayload.summary?.total_kamar ?? filePayload.data?.kamar?.length ?? 0;
                            const penyewaCount = filePayload.summary?.total_penyewa ?? filePayload.data?.penyewa?.length ?? 0;
                            const tagihanCount = filePayload.summary?.total_tagihan ?? filePayload.data?.tagihan?.length ?? 0;
                            const operasionalCount = filePayload.summary?.total_operasional ?? filePayload.data?.operasional?.length ?? 0;
                            const ownerName = filePayload.owner?.name || filePayload.exportedBy || "Pengguna SmartKos";
                            const ownerEmail = filePayload.owner?.email || filePayload.email || "-";
                            const exportDateStr = filePayload.exported_at || filePayload.backupDate;

                            return (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">File Backup Valid</span>
                                        <span className="text-[10px] text-slate-400">
                                            {exportDateStr ? new Date(exportDateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <p><strong className="text-white">Pemilik Asli:</strong> {ownerName} ({ownerEmail})</p>
                                        <p><strong className="text-white">Isi Cadangan:</strong> {kosCount} Kos, {kamarCount} Kamar, {penyewaCount} Penyewa, {tagihanCount} Tagihan, {operasionalCount} Operasional</p>
                                    </div>

                                    {/* Mode Selection */}
                                    <div className="pt-2 border-t border-emerald-500/20">
                                        <label className="block text-xs font-bold text-white mb-2">Pilih Mode Restore:</label>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => setRestoreMode("replace")}
                                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                                    restoreMode === "replace"
                                                        ? "bg-red-500/20 border-red-500/50 text-red-300 font-bold"
                                                        : "bg-slate-800 border-slate-700 text-slate-400"
                                                }`}
                                            >
                                                <span className="block text-[11px] text-white font-bold mb-0.5">⚡ Timpa (Replace)</span>
                                                <span className="text-[9px] leading-tight block text-slate-300">Hapus data saat ini & ganti total</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setRestoreMode("merge")}
                                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                                    restoreMode === "merge"
                                                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold"
                                                        : "bg-slate-800 border-slate-700 text-slate-400"
                                                }`}
                                            >
                                                <span className="block text-[11px] text-white font-bold mb-0.5">🔄 Gabungkan (Merge)</span>
                                                <span className="text-[9px] leading-tight block text-slate-300">Tambahkan data tanpa menghapus</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={!filePayload || restoring}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {restoring ? (
                            <>
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Memulihkan Data...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>Mulai Restore Data</span>
                            </>
                        )}
                    </button>
                </div>

            </div>

            {/* CONFIRMATION MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white">Konfirmasi Restore Data</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                {restoreMode === "replace"
                                    ? "PERINGATAN: Mode Timpa Data akan MENGHAPUS SELURUH data kos, kamar, penyewa, dan tagihan Anda saat ini, lalu menggantinya dengan data dari file backup."
                                    : "Mode Gabungkan Data akan menambahkan seluruh unit kos, penyewa, dan tagihan dari file backup ke database Anda."}
                            </p>
                        </div>

                        {restoreMode === "replace" && (
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-300">
                                    Ketik <span className="text-red-400 font-extrabold uppercase">RESTORE</span> untuk mengonfirmasi:
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="RESTORE"
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setConfirmText("");
                                }}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteRestore}
                                disabled={restoreMode === "replace" && confirmText.trim().toLowerCase() !== "restore"}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
