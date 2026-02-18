"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        {
            href: "/dashboard",
            label: "Beranda",
            icon: (active) => (
                <svg className={`w-6 h-6 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            href: "/dashboard/kos",
            label: "Kos",
            icon: (active) => (
                <svg className={`w-6 h-6 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            href: "/dashboard/kamar",
            label: "Kamar",
            icon: (active) => (
                <svg className={`w-6 h-6 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            href: "/dashboard/tagihan",
            label: "Tagihan",
            icon: (active) => (
                <svg className={`w-6 h-6 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        // Using 'Saya' (Me) for profile/account to match Dana style roughly found in wallets
        {
            href: "/dashboard/akun",
            label: "Saya",
            icon: (active) => (
                <svg className={`w-6 h-6 ${active ? "text-indigo-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-[#334155] z-50 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-full h-full space-y-1"
                        >
                            {item.icon(isActive)}
                            <span className={`text-[10px] font-medium ${isActive ? "text-indigo-400" : "text-slate-400"}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
