"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function BillingPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("annual"); // default: best value
    const [showPayModal, setShowPayModal] = useState(false);
    const [payMethod, setPayMethod] = useState("qris");
    const [payStep, setPayStep] = useState(1); // 1: Select Method & Info, 2: Simulating, 3: Success
    const router = useRouter();
    const supabase = createClient();

    const plans = {
        monthly: {
            id: "monthly",
            name: "Paket Bulanan",
            price: 50000,
            duration: 30,
            desc: "Ideal untuk mencoba kenyamanan mengelola kos secara digital.",
            features: [
                "Kelola unit Kos tanpa batasan",
                "Kirim tagihan via WhatsApp",
                "Pencatatan Pemasukan & Operasional",
                "Laporan Keuangan Dasar",
                "Dukungan via Email & WA"
            ],
            badge: null
        },
        semester: {
            id: "semester",
            name: "Paket Semesteran",
            price: 270000,
            duration: 180,
            desc: "Pilihan hemat untuk operasional jangka menengah kos Anda.",
            features: [
                "Seluruh fitur Paket Bulanan",
                "Hemat biaya langganan 10%",
                "Pembuatan Kwitansi Kustom",
                "Prioritas Antrian Broadcast WA",
                "Dukungan Teknis Prioritas"
            ],
            badge: "Hemat 10%"
        },
        annual: {
            id: "annual",
            name: "Paket Tahunan",
            price: 480000,
            duration: 365,
            desc: "Solusi terbaik dan termurah untuk ketenangan manajemen jangka panjang.",
            features: [
                "Seluruh fitur Paket Semesteran",
                "Hemat biaya langganan 20%",
                "Multi-Admin Hub",
                "Backup Data Bulanan Otomatis",
                "Dukungan VIP & Bimbingan Khusus"
            ],
            badge: "Paling Populer"
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
            }
            setLoading(false);
        };
        getUser();
    }, []);

    const isSubscriptionActive = () => {
        if (!user) return false;
        if (user.subscription_status === "inactive") return false;
        if (!user.subscription_expired_at) return false;
        return new Date(user.subscription_expired_at) >= new Date();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const triggerPaymentSimulation = () => {
        setPayStep(1);
        setShowPayModal(true);
    };

    const handleActivateSubscription = async () => {
        setPayStep(2);
        
        // Simulate processing for 2 seconds
        setTimeout(async () => {
            try {
                const selectedPlanDetails = plans[selectedPlan];
                let baseDate = new Date();
                
                // If current subscription is active, extend from current expiry date.
                // Otherwise, extend from today.
                if (user?.subscription_expired_at && new Date(user.subscription_expired_at) > new Date()) {
                    baseDate = new Date(user.subscription_expired_at);
                }
                
                const newExpirationDate = new Date(baseDate.getTime() + selectedPlanDetails.duration * 24 * 60 * 60 * 1000);
                const expiryString = newExpirationDate.toISOString().split("T")[0];

                const { error } = await supabase
                    .from("users")
                    .update({
                        subscription_status: "active",
                        subscription_expired_at: expiryString
                    })
                    .eq("id", user.id);

                if (error) throw error;

                // Update local state
                setUser(prev => ({
                    ...prev,
                    subscription_status: "active",
                    subscription_expired_at: expiryString
                }));

                setPayStep(3);
                router.refresh();
            } catch (err) {
                console.error("Gagal mengaktifkan langganan:", err);
                alert("Terjadi kesalahan teknis saat mengaktifkan langganan. Silakan coba lagi.");
                setPayStep(1);
                setShowPayModal(false);
            }
        }, 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center text-slate-400">
                    <svg className="animate-spin w-8 h-8 mx-auto text-indigo-500 mb-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Memuat informasi langganan...</span>
                </div>
            </div>
        );
    }

    const isActive = isSubscriptionActive();

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 lg:p-12 relative overflow-hidden">
            {/* Background design */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Top Nav Back */}
                <div className="flex justify-between items-center mb-10">
                    {isActive ? (
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-semibold"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-semibold"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Keluar & Login Akun Lain
                        </button>
                    )}
                    <span className="text-xs font-bold text-slate-500 tracking-wider">SMARTKOS PREMIUM</span>
                </div>

                {/* Sub banner status */}
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                        Pilih Paket Langganan Anda
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                        Nikmati kemudahan pengelolaan kos tanpa batas, pengiriman invoice WhatsApp otomatis, dan pencatatan keuangan real-time.
                    </p>

                    {/* Current Status Card */}
                    <div className="mt-8 inline-block w-full max-w-md bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center gap-4 text-left">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Status Langganan Saat Ini</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Status: <span className={isActive ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>{isActive ? "Aktif" : "Kedaluwarsa"}</span>
                                </p>
                                <p className="text-xs text-slate-300 mt-1">
                                    {isActive ? "Paket aktif hingga" : "Masa aktif habis pada"}:{" "}
                                    <span className="text-white font-semibold">
                                        {user?.subscription_expired_at ? new Date(user.subscription_expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-16">
                    {Object.values(plans).map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <div
                                key={plan.id}
                                className={`rounded-3xl p-8 border transition-all flex flex-col justify-between relative shadow-2xl cursor-pointer ${
                                    isSelected
                                        ? "bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] border-indigo-500 scale-105 ring-2 ring-indigo-500/20"
                                        : "bg-[#1e293b]/70 border-slate-700/60 hover:border-slate-600/80 hover:bg-[#1e293b]"
                                }`}
                                onClick={() => setSelectedPlan(plan.id)}
                            >
                                {plan.badge && (
                                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                                        {plan.badge}
                                    </span>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-white font-extrabold text-xl">{plan.name}</h3>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "border-indigo-500" : "border-slate-600"}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-xs mb-6 line-clamp-2 leading-relaxed">{plan.desc}</p>
                                    
                                    <div className="flex items-baseline gap-1 mb-8">
                                        <span className="text-slate-400 text-sm font-semibold">Rp</span>
                                        <span className="text-white text-3xl font-black tracking-tight">
                                            {plan.price.toLocaleString("id-ID")}
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            / {plan.duration === 30 ? "bulan" : plan.duration === 180 ? "6 bln" : "tahun"}
                                        </span>
                                    </div>

                                    {/* Features */}
                                    <div className="border-t border-slate-700/50 pt-6 mb-8">
                                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Fitur Utama:</h4>
                                        <ul className="space-y-3.5">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                                                    <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="leading-relaxed">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPlan(plan.id);
                                        triggerPaymentSimulation();
                                    }}
                                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all shadow-lg ${
                                        isSelected
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/20"
                                            : "bg-[#334155] text-slate-200 hover:bg-[#475569]"
                                    }`}
                                >
                                    {isActive ? "Perpanjang" : "Aktifkan Sekarang"}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer manual contact */}
                <div className="text-center bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-xl">
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Lebih menyukai pembayaran manual? Silakan hubungi admin kami langsung melalui WhatsApp untuk melakukan transfer manual dan konfirmasi data.
                    </p>
                    <a
                        href={`https://wa.me/6281717594886?text=${encodeURIComponent("Halo Admin SmartKos, saya ingin memperpanjang paket langganan secara manual.")}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all shadow-md"
                    >
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        </svg>
                        Hubungi Admin (WhatsApp Manual)
                    </a>
                </div>
            </div>

            {/* Payment simulation modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                        {payStep < 3 && (
                            <button
                                onClick={() => setShowPayModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {payStep === 1 && (
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-1">Simulasi Pembayaran Premium</h3>
                                <p className="text-xs text-slate-400 mb-6">Paket yang dipilih: <span className="text-indigo-400 font-semibold">{plans[selectedPlan].name}</span> (Rp {plans[selectedPlan].price.toLocaleString("id-ID")})</p>

                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Metode Pembayaran (Demo):</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            onClick={() => setPayMethod("qris")}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                                payMethod === "qris" ? "border-indigo-500 bg-indigo-500/5 text-white" : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                                            }`}
                                        >
                                            <span className="font-extrabold text-sm">QRIS</span>
                                        </div>
                                        <div
                                            onClick={() => setPayMethod("dana")}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                                payMethod === "dana" ? "border-indigo-500 bg-indigo-500/5 text-white" : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                                            }`}
                                        >
                                            <span className="font-extrabold text-sm text-sky-400">DANA</span>
                                        </div>
                                        <div
                                            onClick={() => setPayMethod("bca")}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                                payMethod === "bca" ? "border-indigo-500 bg-indigo-500/5 text-white" : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                                            }`}
                                        >
                                            <span className="font-extrabold text-sm text-blue-500">Transfer BCA</span>
                                        </div>
                                        <div
                                            onClick={() => setPayMethod("mandiri")}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                                payMethod === "mandiri" ? "border-indigo-500 bg-indigo-500/5 text-white" : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                                            }`}
                                        >
                                            <span className="font-extrabold text-sm text-yellow-500">Transfer Mandiri</span>
                                        </div>
                                    </div>

                                    {/* Virtual bill details */}
                                    <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-4 mt-6 text-xs text-slate-300">
                                        <div className="flex justify-between py-1">
                                            <span>Nominal Paket</span>
                                            <span>Rp {plans[selectedPlan].price.toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-slate-850 pb-2">
                                            <span>Kode Unik / Biaya Layanan</span>
                                            <span className="text-emerald-400">Gratis (Simulasi)</span>
                                        </div>
                                        <div className="flex justify-between py-1 pt-2 font-bold text-sm text-white">
                                            <span>Total Pembayaran</span>
                                            <span>Rp {plans[selectedPlan].price.toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleActivateSubscription}
                                        className="w-full mt-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm uppercase rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg"
                                    >
                                        Bayar & Aktifkan Otomatis (Simulasi)
                                    </button>
                                </div>
                            </div>
                        )}

                        {payStep === 2 && (
                            <div className="p-10 text-center">
                                <svg className="animate-spin w-12 h-12 mx-auto text-indigo-500 mb-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <h3 className="text-lg font-bold text-white mb-2">Memproses Transaksi...</h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                                    Kami sedang melakukan simulasi koneksi dengan payment gateway dan mengaktifkan fitur premium di database akun SmartKos Anda.
                                </p>
                            </div>
                        )}

                        {payStep === 3 && (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Pembayaran Berhasil!</h3>
                                <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-xs mx-auto">
                                    Selamat! Paket <span className="text-indigo-400 font-semibold">{plans[selectedPlan].name}</span> Anda telah aktif hingga{" "}
                                    <span className="text-white font-semibold">
                                        {user?.subscription_expired_at ? new Date(user.subscription_expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                    </span>
                                    . Seluruh fitur SmartKos kini dapat Anda gunakan kembali sepenuhnya.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowPayModal(false);
                                        router.push("/dashboard");
                                        router.refresh();
                                    }}
                                    className="w-full py-3 bg-indigo-500 text-white font-bold text-sm uppercase rounded-xl hover:bg-indigo-600 transition-all shadow-lg"
                                >
                                    Masuk ke Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
