"use client";

import { useState, useEffect } from "react";
import StatsCard from "@/components/StatsCard";
import { createClient } from "@/lib/supabase";

export default function DashboardPage() {
    const [stats, setStats] = useState({ totalKos: 0, totalKamar: 0, kamarTerisi: 0, tagihanBelum: 0 });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [kosRes, kamarRes, tagihanRes] = await Promise.all([
            supabase.from("kos").select("id", { count: "exact" }).eq("user_id", user.id),
            supabase.from("kamar").select("id, status, kos!inner(user_id)").eq("kos.user_id", user.id),
            supabase.from("tagihan").select("id, status, penyewa!inner(kamar!inner(kos!inner(user_id)))").eq("penyewa.kamar.kos.user_id", user.id).eq("status", "belum"),
        ]);

        const totalKamar = kamarRes.data?.length || 0;
        const kamarTerisi = kamarRes.data?.filter(k => k.status === "isi").length || 0;

        setStats({
            totalKos: kosRes.count || 0,
            totalKamar,
            kamarTerisi,
            tagihanBelum: tagihanRes.data?.length || 0,
        });
        setLoading(false);
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-slate-400">Selamat datang kembali! Berikut ringkasan data kos Anda.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <StatsCard
                    color="indigo"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    }
                    label="Total Kos"
                    value={loading ? "..." : stats.totalKos}
                />
                <StatsCard
                    color="blue"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    }
                    label="Total Kamar"
                    value={loading ? "..." : stats.totalKamar}
                />
                <StatsCard
                    color="green"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    label="Kamar Terisi"
                    value={loading ? "..." : stats.kamarTerisi}
                />
                <StatsCard
                    color="red"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    label="Tagihan Belum Lunas"
                    value={loading ? "..." : stats.tagihanBelum}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Aksi Cepat</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <a href="/dashboard/kos" className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tambah Kos Baru
                    </a>
                    <a href="/dashboard/penyewa" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Tambah Penyewa
                    </a>
                    <a href="/dashboard/tagihan" className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Generate Tagihan
                    </a>
                </div>
            </div>
        </div>
    );
}
