"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";
import { createClient } from "@/lib/supabase";

import { useKos } from "@/context/KosContext";

export default function DashboardPage() {
    const { selectedKosId } = useKos();
    const [stats, setStats] = useState({ totalKos: 0, totalKamar: 0, kamarTerisi: 0, tagihanBelumTotal: 0, tagihanBelumCount: 0 });
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [selectedKosId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Build queries based on selectedKosId
            let kosQuery = supabase.from("kos").select("id", { count: "exact" });
            let kamarQuery = supabase.from("kamar").select("id, status, kos_id");
            let tagihanQuery = supabase.from("tagihan").select("id, jumlah, status, penyewa_id").eq("status", "belum");
            let recentTenantsQuery = supabase.from("penyewa").select("id, nama, created_at, kamar!inner(nomor, kos_id)").order("created_at", { ascending: false }).limit(3);
            let recentBillsQuery = supabase.from("tagihan").select("id, jumlah, status, created_at, penyewa!inner(nama, kamar!inner(nomor, kos_id))").order("created_at", { ascending: false }).limit(3);

            if (selectedKosId !== "all") {
                kosQuery = kosQuery.eq("id", selectedKosId);
                kamarQuery = kamarQuery.eq("kos_id", selectedKosId);

                // For tagihan, we need to filter via penyewa -> kamar -> kos
                // Simplified using inner join for Postgres
                tagihanQuery = supabase.from("tagihan")
                    .select("id, jumlah, status, penyewa!inner(id, kamar!inner(id, kos_id))")
                    .eq("status", "belum")
                    .eq("penyewa.kamar.kos_id", selectedKosId);

                recentTenantsQuery = recentTenantsQuery.eq("kamar.kos_id", selectedKosId);
                recentBillsQuery = recentBillsQuery.eq("penyewa.kamar.kos_id", selectedKosId);
            }

            const [kosRes, kamarRes, tagihanRes, recentTenantsRes, recentBillsRes] = await Promise.all([
                kosQuery,
                kamarQuery,
                tagihanQuery,
                recentTenantsQuery,
                recentBillsQuery,
            ]);

            const totalKamar = kamarRes.data?.length || 0;
            const kamarTerisi = kamarRes.data?.filter(k =>
                k.status && k.status.toLowerCase() !== "kosong"
            ).length || 0;

            const tagihanBelumCount = tagihanRes.data?.length || 0;
            const tagihanBelumTotal = tagihanRes.data?.reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0) || 0;

            setStats({
                totalKos: kosRes.count || 0,
                totalKamar,
                kamarTerisi,
                tagihanBelumTotal,
                tagihanBelumCount,
            });

            // Combine and format activities
            const combinedActivities = [
                ...(recentTenantsRes.data || []).map(p => ({
                    id: `p-${p.id}`,
                    type: "penyewa",
                    title: "Penyewa Baru",
                    subtitle: `${p.nama} di Kamar ${p.kamar?.nomor || "-"}`,
                    date: new Date(p.created_at),
                    icon: (
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )
                })),
                ...(recentBillsRes.data || []).map(t => ({
                    id: `t-${t.id}`,
                    type: "tagihan",
                    title: t.status === "lunas" ? "Tagihan Dibayar" : "Tagihan Baru",
                    subtitle: `${t.penyewa?.nama || "Penyewa"} - Rp ${t.jumlah?.toLocaleString('id-ID') || 0}`,
                    date: new Date(t.created_at),
                    icon: (
                        <div className={`w-10 h-10 rounded-full ${t.status === 'lunas' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'} flex items-center justify-center`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    )
                }))
            ].sort((a, b) => b.date - a.date).slice(0, 5);

            setActivities(combinedActivities);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-20 lg:pb-0">
            {/* Mobile Top Section (Premium Deep Purple) */}
            <div className="lg:hidden bg-gradient-to-b from-[#2e1065] to-[#1e1b4b] pt-4 pb-16 px-4 rounded-b-[2.5rem]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-semibold shadow-lg">
                            U
                        </div>
                        <div>
                            <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Selamat Datang,</p>
                            <p className="text-white font-black text-sm">Owner Kos</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="text-white/80 hover:text-white transition-colors relative">
                            <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full border border-[#2e1065]"></span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="text-white mb-4">
                    <p className="text-white/60 text-xs font-medium mb-1">Total Tagihan Belum Lunas</p>
                    <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white/50">Rp</span>
                        {stats.tagihanBelumTotal.toLocaleString('id-ID')}
                    </h2>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                        Dari {stats.tagihanBelumCount} Tagihan Belum Lunas
                    </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex justify-between gap-4 mt-8">
                    <Link href="/dashboard/pemasukan" className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-active:scale-95 transition-all shadow-xl">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">Pemasukan</span>
                    </Link>
                    <Link href="/dashboard/operasional" className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-active:scale-95 transition-all shadow-xl">
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">Operasional</span>
                    </Link>
                    <Link href="/dashboard/laporan" className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-active:scale-95 transition-all shadow-xl">
                            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">Laporan</span>
                    </Link>
                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-active:scale-95 transition-all shadow-xl">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">Lainnya</span>
                    </button>
                </div>
            </div>

            {/* Floating Card Content (Occupancy) - overlapping the blue header */}
            <div className="lg:hidden mx-4 -mt-8 relative z-10 bg-[#1e293b] rounded-xl shadow-lg border border-slate-700 p-4 flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-slate-400 text-xs font-medium mb-1">Okupansi Kamar</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{stats.kamarTerisi}</span>
                        <span className="text-sm text-slate-400 mb-1">/ {stats.totalKamar} Terisi</span>
                    </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>


            {/* Quick Service Grid */}
            <div className="lg:hidden px-4 grid grid-cols-4 gap-y-6 gap-x-2 mb-8">
                <a href="/dashboard/kos" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Data<br />Kos</span>
                </a>
                <a href="/dashboard/kamar" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Kamar<br />Saya</span>
                </a>
                <a href="/dashboard/penyewa" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Data<br />Penyewa</span>
                </a>
                <a href="/dashboard/laporan" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Laporan</span>
                </a>
                <a href="/dashboard/tagihan" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Buat<br />Tagihan</span>
                </a>
                <a href="/dashboard/kelola" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Kelola</span>
                </a>
                <a href="/dashboard/bantuan" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Bantuan</span>
                </a>
                <a href="#" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                    <span className="text-[11px] text-slate-300 text-center leading-tight">Lainnya</span>
                </a>
            </div>

            {/* Recent Activity Section */}
            <div className="lg:hidden px-4 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-bold text-base">Aktivitas Terbaru</h2>
                    <button className="text-[#118eea] text-xs font-semibold">Lihat Semua</button>
                </div>

                <div className="bg-[#1e293b] rounded-2xl border border-slate-700 divide-y divide-slate-700 overflow-hidden">
                    {loading ? (
                        <div className="p-4 text-center text-slate-400 text-sm italic">Memuat aktivitas...</div>
                    ) : activities.length > 0 ? (
                        activities.map((activity) => (
                            <div key={activity.id} className="p-4 flex items-center gap-4 active:bg-slate-800 transition-colors">
                                {activity.icon}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">{activity.title}</p>
                                    <p className="text-slate-400 text-xs truncate">{activity.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-[10px]">
                                        {activity.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-slate-400 text-sm">Belum ada aktivitas baru</div>
                    )}
                </div>
            </div>

            {/* Info Section (Promo/Tips style) */}
            <div className="lg:hidden px-4 mb-12">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Tips Kelola Kos</h4>
                        <p className="text-white/80 text-xs mt-0.5">Berikan tagihan tepat waktu untuk menjaga arus kas tetap lancar.</p>
                    </div>
                </div>
            </div>

            {/* Desktop View (Original) - Hidden on Mobile */}
            <div className="hidden lg:block">
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
                        label={`Tagihan Belum Lunas (${stats.tagihanBelumCount} Orang)`}
                        value={loading ? "..." : `Rp ${stats.tagihanBelumTotal.toLocaleString('id-ID')}`}
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Aksi Cepat</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <a href="/dashboard/kos" className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="font-medium">Tambah Kos</span>
                        </a>
                        <a href="/dashboard/penyewa" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span className="font-medium">Tambah Penyewa</span>
                        </a>
                        <a href="/dashboard/tagihan" className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="font-medium">Buat Tagihan</span>
                        </a>
                        <a href="/dashboard/operasional" className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Catat Biaya</span>
                        </a>
                        <a href="/dashboard/laporan" className="flex items-center gap-3 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Lihat Laporan</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
