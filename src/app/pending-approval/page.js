"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function PendingApprovalPage() {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("users")
                .select("is_approved, subscription_status, name, email")
                .eq("id", authUser.id)
                .single();

            if (profile?.is_approved) {
                router.push("/dashboard");
            } else {
                setUser(profile);
            }
        };

        checkStatus();

        // Poll for approval status every 8 seconds
        const interval = setInterval(checkStatus, 8000);
        return () => clearInterval(interval);
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const isRenewal = user?.subscription_status === "pending_renewal";

    const handleContactAdmin = () => {
        const message = isRenewal
            ? `Halo Admin SmartKos, akun saya atas nama *${user?.name || "Owner"}* (${user?.email || ""}) telah mengajukan perpanjangan paket langganan. Mohon bantuan persetujuannya. Terima kasih!`
            : `Halo Admin SmartKos, akun saya atas nama *${user?.name || "Owner"}* (${user?.email || ""}) sudah terdaftar dan saat ini sedang menunggu persetujuan. Mohon bantuannya untuk menyetujui akun saya. Terima kasih!`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/6281717594886?text=${encoded}`, "_blank");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a] text-slate-100 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md text-center">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-6 shadow-xl animate-pulse">
                        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
                        {isRenewal ? "Menunggu Persetujuan Perpanjangan" : "Menunggu Persetujuan Admin"}
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base">
                        Halo <span className="text-indigo-400 font-bold">{user?.name || "Owner"}</span>, {isRenewal ? "pengajuan perpanjangan langganan Anda telah terkirim." : "akun pendaftaran Anda telah berhasil tercatat di sistem."}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                        {isRenewal
                            ? "Pengajuan perpanjangan akun Anda sedang ditinjau oleh Admin SmartKos. Halaman ini akan otomatis masuk ke Dashboard setelah disetujui."
                            : "Saat ini akun Anda sedang ditinjau oleh Administrator SmartKos. Halaman ini akan otomatis masuk ke Dashboard setelah disetujui."}
                    </p>
                </div>

                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4 sm:p-5 mb-6 shadow-lg">
                    <p className="text-xs sm:text-sm font-medium text-amber-300 flex items-center justify-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                        Status: {isRenewal ? "Menunggu Persetujuan Perpanjangan" : "Menunggu Persetujuan Super Admin"}
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleContactAdmin}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        </svg>
                        Hubungi Admin via WhatsApp
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 px-4 rounded-xl border border-[#334155] text-slate-400 font-semibold text-xs hover:text-white hover:bg-[#334155] transition-all"
                    >
                        Keluar & Login Akun Lain
                    </button>
                </div>
            </div>
        </div>
    );
}
