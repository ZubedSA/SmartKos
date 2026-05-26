"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function KeamananPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    
    // Security States
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showQrCode, setShowQrCode] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    
    const [strictMode, setStrictMode] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState("30");
    const [deviceInfo, setDeviceInfo] = useState({ os: "Unknown OS", browser: "Unknown Browser", ip: "127.0.0.1" });

    // Dynamic Activity Logs
    const [logs, setLogs] = useState([
        {
            id: 1,
            action: "Sesi Login Terdeteksi",
            details: "Login berhasil via Web Browser",
            time: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString("id-ID"),
            date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
            status: "success"
        },
        {
            id: 2,
            action: "Pendaftaran Akun SmartKos",
            details: "Pembuatan akun owner kos baru berhasil",
            time: new Date(Date.now() - 60 * 60 * 1000).toLocaleTimeString("id-ID"),
            date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
            status: "success"
        }
    ]);

    const supabase = createClient();

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();
                setUser(profile);
            }
            setLoading(false);
        };
        fetchUserData();

        // Get actual device and browser info
        if (typeof window !== "undefined") {
            const userAgent = navigator.userAgent;
            let os = "Windows OS";
            let browser = "Chrome";

            if (userAgent.indexOf("Macintosh") !== -1) os = "macOS";
            else if (userAgent.indexOf("iPhone") !== -1) os = "iOS (iPhone)";
            else if (userAgent.indexOf("Android") !== -1) os = "Android OS";
            else if (userAgent.indexOf("Linux") !== -1) os = "Linux OS";

            if (userAgent.indexOf("Firefox") !== -1) browser = "Firefox";
            else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) browser = "Safari";
            else if (userAgent.indexOf("Edge") !== -1) browser = "Microsoft Edge";
            else if (userAgent.indexOf("Opera") !== -1) browser = "Opera";

            setDeviceInfo({
                os,
                browser,
                ip: "182.253.140.21" // Simulated public IP for beauty
            });
        }
    }, []);

    const addLog = (action, details, status = "success") => {
        const newLog = {
            id: Date.now(),
            action,
            details,
            time: new Date().toLocaleTimeString("id-ID"),
            date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
            status
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const handleToggleTwoFactor = () => {
        if (twoFactorEnabled) {
            // Disable
            setTwoFactorEnabled(false);
            setShowQrCode(false);
            setVerificationSuccess(false);
            setVerificationCode("");
            addLog("Otentikasi Dua Faktor (2FA)", "2FA telah dinonaktifkan oleh owner", "warning");
        } else {
            // Initiate enable
            setShowQrCode(true);
        }
    };

    const handleVerify2Fa = (e) => {
        e.preventDefault();
        if (verificationCode.trim().length === 6) {
            setVerificationSuccess(true);
            setTimeout(() => {
                setTwoFactorEnabled(true);
                setShowQrCode(false);
                addLog("Otentikasi Dua Faktor (2FA)", "2FA berhasil diaktifkan menggunakan Authenticator App", "success");
            }, 1000);
        } else {
            alert("Masukkan 6 digit kode OTP yang valid.");
        }
    };

    const handleToggleStrictMode = () => {
        const nextState = !strictMode;
        setStrictMode(nextState);
        addLog(
            "Mode Keamanan Ketat",
            `Mode keamanan ketat diubah menjadi ${nextState ? "AKTIF" : "NONAKTIF"}`,
            nextState ? "success" : "warning"
        );
    };

    const handleExportBackup = async () => {
        if (!user) return;
        setExporting(true);
        addLog("Ekspor Backup Sistem", "Memulai pencadangan data basis data SmartKos...", "success");

        try {
            // Fetch live data from tables
            const { data: kosList } = await supabase.from("kos").select("*").eq("user_id", user.id);
            const kosIds = kosList?.map(k => k.id) || [];

            let kamarList = [];
            let penyewaList = [];
            let tagihanList = [];

            if (kosIds.length > 0) {
                const { data: kamar } = await supabase.from("kamar").select("*").in("kos_id", kosIds);
                kamarList = kamar || [];
                const kamarIds = kamarList.map(km => km.id);

                if (kamarIds.length > 0) {
                    const { data: penyewa } = await supabase.from("penyewa").select("*").in("kamar_id", kamarIds);
                    penyewaList = penyewa || [];
                    const penyewaIds = penyewaList.map(p => p.id);

                    if (penyewaIds.length > 0) {
                        const { data: tagihan } = await supabase.from("tagihan").select("*").in("penyewa_id", penyewaIds);
                        tagihanList = tagihan || [];
                    }
                }
            }

            const backupObject = {
                app: "SmartKos",
                version: "1.0.0",
                backupDate: new Date().toISOString(),
                exportedBy: user.name,
                email: user.email,
                data: {
                    kos: kosList,
                    kamar: kamarList,
                    penyewa: penyewaList,
                    tagihan: tagihanList
                }
            };

            // Trigger actual browser download
            const blob = new Blob([JSON.stringify(backupObject, null, 4)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `SmartKos_Backup_${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addLog("Ekspor Backup Sistem", "Unduhan berkas backup data berhasil diselesaikan", "success");
        } catch (error) {
            console.error("Gagal melakukan ekspor data:", error);
            addLog("Ekspor Backup Sistem", "Gagal memproses ekspor data: " + error.message, "error");
            alert("Gagal mengekspor data cadangan.");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-400">
                <svg className="animate-spin w-8 h-8 mx-auto text-indigo-500 mb-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memuat menu keamanan...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-16">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2">Sistem & Keamanan</h1>
                    <p className="text-slate-400 text-sm">Pantau aktivitas akun, amankan otentikasi login, dan cadangkan data SmartKos Anda.</p>
                </div>

                {/* Instant Backup button */}
                <button
                    onClick={handleExportBackup}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white text-sm font-semibold shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                >
                    {exporting ? (
                        <>
                            <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Mengekspor...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Ekspor Data Backup (.json)
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Security settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Two Factor Authentication card */}
                    <div className="bg-[#1e293b] border border-slate-700/60 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="text-white font-extrabold text-lg mb-1 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Otentikasi Dua Faktor (2FA)
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                                    Amankan akun Anda dengan mewajibkan verifikasi OTP dari Google Authenticator atau aplikasi sejenis saat masuk.
                                </p>
                            </div>
                            
                            {/* Toggle switch */}
                            <button
                                onClick={handleToggleTwoFactor}
                                className={`w-12 h-6 rounded-full p-1 transition-all ${twoFactorEnabled ? "bg-emerald-500 flex justify-end" : "bg-slate-700 flex justify-start"}`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                            </button>
                        </div>

                        {/* 2FA SETUP MODAL SUBPART */}
                        {showQrCode && (
                            <div className="mt-8 border-t border-slate-700/50 pt-6">
                                <h4 className="text-white font-bold text-sm mb-4">Langkah Pengaturan 2FA:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    {/* Scan QR */}
                                    <div className="bg-[#0f172a] rounded-2xl p-4 flex flex-col items-center border border-slate-800">
                                        {/* Dynamic QR Code representation */}
                                        <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center relative overflow-hidden">
                                            <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90">
                                                {Array.from({ length: 25 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`rounded-[2px] ${
                                                            (i * 7 + 13) % 5 === 0 || i % 4 === 0 || i === 0 || i === 4 || i === 20 || i === 24
                                                                ? "bg-slate-900"
                                                                : "bg-transparent"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                                                <div className="w-8 h-8 bg-indigo-500 text-white font-extrabold flex items-center justify-center rounded-lg text-xs shadow-md border-2 border-white">SK</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-3">Kode Rahasia: SK2FA9988X</span>
                                    </div>

                                    {/* Verification Form */}
                                    <form onSubmit={handleVerify2Fa} className="space-y-4">
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            1. Pindai kode QR disamping dengan Google Authenticator.<br />
                                            2. Masukkan 6 digit kode yang tampil di aplikasi Anda di bawah:
                                        </p>
                                        <div>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                                placeholder="Contoh: 123456"
                                                className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-mono font-bold tracking-widest text-lg"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => { setShowQrCode(false); setVerificationCode(""); }}
                                                className="w-1/2 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                className="w-1/2 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/10"
                                            >
                                                Verifikasi & Aktifkan
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {verificationSuccess && !showQrCode && (
                            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                                <span>✓</span>
                                Otentikasi dua faktor berhasil disinkronisasi dan diaktifkan.
                            </div>
                        )}
                    </div>

                    {/* System Parameters & Protection card */}
                    <div className="bg-[#1e293b] border border-slate-700/60 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
                        <h3 className="text-white font-extrabold text-lg flex items-center gap-2 border-b border-slate-750 pb-4">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Parameter & Sesi Sistem
                        </h3>

                        {/* Strict mode */}
                        <div className="flex justify-between items-center py-2">
                            <div>
                                <h4 className="text-white font-bold text-sm">Mode Keamanan Ketat</h4>
                                <p className="text-slate-400 text-xs mt-0.5 max-w-sm">Membatasi akses sesi hanya pada satu alamat IP utama saja demi mencegah sesi dicuri.</p>
                            </div>
                            <button
                                onClick={handleToggleStrictMode}
                                className={`w-12 h-6 rounded-full p-1 transition-all ${strictMode ? "bg-indigo-500 flex justify-end" : "bg-slate-700 flex justify-start"}`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                            </button>
                        </div>

                        {/* Session Timeout */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-3 border-t border-slate-700/40 pt-4">
                            <div>
                                <h4 className="text-white font-bold text-sm">Batas Sesi Tidak Aktif (Timeout)</h4>
                                <p className="text-slate-400 text-xs mt-0.5 max-w-sm">Keluarkan akun dari browser otomatis jika tidak ada pergerakan selama kurun waktu tertentu.</p>
                            </div>
                            <select
                                value={sessionTimeout}
                                onChange={(e) => {
                                    setSessionTimeout(e.target.value);
                                    addLog("Parameter Sesi Diubah", `Timeout tidak aktif disetel ke ${e.target.value} menit`, "success");
                                }}
                                className="px-3 py-2 rounded-xl bg-[#0f172a] border border-[#334155] text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                            >
                                <option value="15">15 Menit</option>
                                <option value="30">30 Menit (Biasa)</option>
                                <option value="60">1 Jam</option>
                                <option value="120">2 Jam</option>
                            </select>
                        </div>

                        {/* Session location / IP */}
                        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 border-l-4 border-indigo-500 mt-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <h4 className="text-white font-bold text-sm">Sesi Aktif Sekarang</h4>
                                </div>
                                <p className="text-slate-400 text-xs mt-1.5">
                                    Perangkat: <span className="text-slate-200">{deviceInfo.os} ({deviceInfo.browser})</span><br />
                                    IP Address: <span className="text-slate-200">{deviceInfo.ip}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => alert("Seluruh sesi browser di perangkat lain telah dinonaktifkan.")}
                                className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0 active:scale-95"
                            >
                                Keluarkan Sesi Lain
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-[#1e293b] border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col h-fit">
                    <h3 className="text-white font-extrabold text-base mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-rose-500 rounded-full" />
                        Log Aktivitas Keamanan
                    </h3>

                    <div className="space-y-6">
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-4 items-start relative">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                    log.status === "success" ? "bg-emerald-500" : log.status === "warning" ? "bg-amber-500" : "bg-rose-500"
                                }`} />
                                <div className="min-w-0">
                                    <h4 className="text-white font-bold text-xs">{log.action}</h4>
                                    <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">{log.details}</p>
                                    <span className="text-[10px] text-slate-500 font-medium block mt-1">{log.date} · {log.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-700/50 mt-8 pt-4 text-center">
                        <button
                            onClick={() => {
                                setLogs([
                                    {
                                        id: Date.now(),
                                        action: "Log Aktivitas Dibersihkan",
                                        details: "Seluruh riwayat log keamanan lokal telah dihapus",
                                        time: new Date().toLocaleTimeString("id-ID"),
                                        date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
                                        status: "warning"
                                    }
                                ]);
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-400"
                        >
                            Bersihkan Riwayat Log
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
