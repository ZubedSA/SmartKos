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
                .select("is_approved, name")
                .eq("id", authUser.id)
                .single();

            if (profile?.is_approved) {
                router.push("/dashboard");
            } else {
                setUser(profile);
            }
        };

        checkStatus();

        // Optional: Poll for approval status every 10 seconds
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md text-center">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                        <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Menunggu Persetujuan</h1>
                    <p className="text-slate-400 text-lg">
                        Halo <span className="text-white font-semibold">{user?.name || "User"}</span>, akun Anda telah berhasil didaftarkan.
                    </p>
                    <p className="text-slate-400 mt-2">
                        Silakan tunggu admin menyetujui akun Anda sebelum Anda dapat mengakses dashboard SmartKos.
                    </p>
                </div>

                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 mb-8">
                    <p className="text-sm text-slate-400 flex items-center gap-3 justify-center">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Status: Menunggu Konfirmasi Admin
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 px-4 rounded-xl bg-[#334155] text-white font-semibold hover:bg-[#475569] transition-all"
                    >
                        Cek Status Lagi
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 px-4 rounded-xl border border-[#334155] text-slate-400 font-semibold hover:text-white hover:bg-[#334155] transition-all"
                    >
                        Keluar & Login Akun Lain
                    </button>
                </div>

                <p className="text-slate-500 text-sm mt-8">
                    Jika butuh bantuan, silakan hubungi admin SmartKos.
                </p>
            </div>
        </div>
    );
}
