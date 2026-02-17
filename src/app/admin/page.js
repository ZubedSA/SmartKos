"use client";

import { useState, useEffect } from "react";
import StatsCard from "@/components/StatsCard";
import { createClient } from "@/lib/supabase";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        const { data: users } = await supabase
            .from("users")
            .select("id, subscription_status, role")
            .eq("role", "owner");

        const total = users?.length || 0;
        const active = users?.filter(u => u.subscription_status === "active").length || 0;

        setStats({
            totalUsers: total,
            activeUsers: active,
            inactiveUsers: total - active,
        });
        setLoading(false);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-slate-400">Statistik global aplikasi SmartKos.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
                <StatsCard
                    color="indigo"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                    label="Total Owner"
                    value={loading ? "..." : stats.totalUsers}
                />
                <StatsCard
                    color="green"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    label="Aktif"
                    value={loading ? "..." : stats.activeUsers}
                />
                <StatsCard
                    color="red"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    }
                    label="Nonaktif"
                    value={loading ? "..." : stats.inactiveUsers}
                />
            </div>
        </div>
    );
}
