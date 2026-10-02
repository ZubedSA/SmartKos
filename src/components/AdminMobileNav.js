"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function AdminMobileNav() {
    const pathname = usePathname();
    const [pendingCount, setPendingCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const { count, error } = await supabase
                    .from("users")
                    .select("*", { count: "exact", head: true })
                    .eq("is_approved", false)
                    .eq("role", "owner");

                if (!error && count !== null) {
                    setPendingCount(count);
                }
            } catch (err) {
                console.error("Error fetching pending count:", err);
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 15000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        {
            href: "/admin",
            label: "Dashboard",
            icon: (active) => (
                <svg className={`w-5 h-5 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            href: "/admin/users",
            label: "Users",
            icon: (active) => (
                <svg className={`w-5 h-5 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            href: "/admin/approvals",
            label: "Persetujuan",
            badge: pendingCount,
            icon: (active) => (
                <div className="relative">
                    <svg className={`w-5 h-5 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {pendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-lg animate-pulse">
                            {pendingCount}
                        </span>
                    )}
                </div>
            )
        },
        {
            href: "/admin/akun",
            label: "Akun",
            icon: (active) => (
                <svg className={`w-5 h-5 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b]/95 backdrop-blur-md border-t border-[#334155] z-50 pb-safe shadow-2xl">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full py-1.5 transition-all duration-150 ${
                                isActive ? "scale-105" : "hover:text-white opacity-80 hover:opacity-100"
                            }`}
                        >
                            <div className={`p-1 rounded-xl transition-all ${
                                isActive ? "bg-indigo-500/15" : ""
                            }`}>
                                {item.icon(isActive)}
                            </div>
                            <span className={`text-[11px] font-medium tracking-tight mt-0.5 ${
                                isActive ? "text-indigo-400 font-semibold" : "text-slate-400"
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
