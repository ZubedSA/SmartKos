"use client";

import { useState, useEffect } from "react";
import StatsCard from "@/components/StatsCard";
import Link from "next/link";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        pendingApprovals: 0,
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            const users = data.users || [];

            const owners = users.filter((u) => u.role === "owner");
            const active = owners.filter((u) => u.subscription_status === "active").length;
            const pending = owners.filter((u) => u.is_approved === false).length;

            setStats({
                totalUsers: owners.length,
                activeUsers: active,
                inactiveUsers: owners.length - active,
                pendingApprovals: pending,
            });

            setRecentUsers(owners.slice(0, 5));
        } catch (err) {
            console.error("Error fetching admin stats:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/20 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Pusat Kontrol Super Admin</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Statistik dan kontrol menyeluruh ekosistem SmartKos.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                        href="/admin/users"
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Kelola Semua User
                    </Link>
                </div>
            </div>

            {/* Pending Approvals Alert Banner (if any) */}
            {stats.pendingApprovals > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-between gap-4 shadow-lg animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Ada {stats.pendingApprovals} Pendaftaran Menunggu Persetujuan!</h2>
                            <p className="text-xs text-amber-200/80">Segera tinjau calon owner untuk memberikan akses penuh.</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/approvals"
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs shrink-0 shadow-md transition-colors"
                    >
                        Tinjau Sekarang
                    </Link>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <StatsCard
                    color="indigo"
                    icon={
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                    label="Total Owner"
                    value={loading ? "..." : stats.totalUsers}
                />
                <StatsCard
                    color="green"
                    icon={
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    label="Langganan Aktif"
                    value={loading ? "..." : stats.activeUsers}
                />
                <StatsCard
                    color="red"
                    icon={
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    }
                    label="Nonaktif / Expired"
                    value={loading ? "..." : stats.inactiveUsers}
                />
                <StatsCard
                    color="amber"
                    icon={
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    label="Persetujuan Pending"
                    value={loading ? "..." : stats.pendingApprovals}
                />
            </div>

            {/* Quick Actions (Mobile Native Grid) */}
            <div className="bg-[#1e293b]/70 border border-[#334155] p-4 sm:p-5 rounded-2xl space-y-3">
                <h2 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider">Aksi Cepat Admin</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Link
                        href="/admin/users"
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex flex-col items-center justify-center text-center gap-2 group transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Tambah User</span>
                    </Link>

                    <Link
                        href="/admin/approvals"
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex flex-col items-center justify-center text-center gap-2 group transition-all relative"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Persetujuan</span>
                        {stats.pendingApprovals > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                        )}
                    </Link>

                    <Link
                        href="/admin/users"
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex flex-col items-center justify-center text-center gap-2 group transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Masa Aktif</span>
                    </Link>

                    <Link
                        href="/admin/akun"
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex flex-col items-center justify-center text-center gap-2 group transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Profil Admin</span>
                    </Link>
                </div>
            </div>

            {/* Recent Registrations Section */}
            <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-white">Owner Terbaru</h2>
                        <p className="text-xs text-slate-400">Daftar akun owner yang baru mendaftar di sistem.</p>
                    </div>
                    <Link
                        href="/admin/users"
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                        Lihat Semua
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : recentUsers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">Belum ada owner terdaftar.</div>
                ) : (
                    <div className="divide-y divide-[#334155]">
                        {recentUsers.map((u) => (
                            <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                        {u.name?.charAt(0)?.toUpperCase() || "O"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{u.name}</p>
                                        <p className="text-xs text-slate-400">{u.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        u.subscription_status === "active"
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                                    }`}>
                                        {u.subscription_status === "active" ? "Aktif" : "Nonaktif"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
