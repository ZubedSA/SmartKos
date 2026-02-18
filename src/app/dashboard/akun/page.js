"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AkunPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Memuat profil...</div>;

    return (
        <div className="max-w-md mx-auto">
            {/* Header Profil */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-center text-white mb-8">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-bold mx-auto mb-4 border-4 border-white/30">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h1 className="text-xl font-bold">{user?.name || "Pengguna SmartKos"}</h1>
                <p className="text-white/70 text-sm">{user?.email}</p>
            </div>

            {/* Menu Akun */}
            <div className="space-y-4">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700 divide-y divide-slate-700 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 text-left active:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-4 text-slate-200">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">Edit Profil</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 text-left active:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-4 text-slate-200">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span className="font-medium">Ganti Password</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 text-left active:bg-slate-800 transition-colors text-red-400" onClick={handleLogout}>
                        <div className="flex items-center gap-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Keluar Aplikasi</span>
                        </div>
                    </button>
                </div>
            </div>

            <p className="text-center text-slate-600 text-xs mt-8 pb-32">SmartKos App v1.0.0</p>
        </div>
    );
}
