"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function KelolaHubPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

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

    const menuItems = [
        {
            title: "Profil & Akun",
            desc: "Kelola informasi pribadi dan email",
            href: "/dashboard/akun",
            color: "indigo",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            title: "Pengaturan WhatsApp",
            desc: "Template pesan dan notifikasi otomatis",
            href: "/dashboard/whatsapp",
            color: "emerald",
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
            )
        },
        {
            title: "Pengaturan Kwitansi",
            desc: "Custom header dan pesan bukti bayar",
            href: "/dashboard/kwitansi",
            color: "purple",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
            )
        },
        {
            title: "Properti Kos",
            desc: "Daftar unit properti dan alamat",
            href: "/dashboard/kos",
            color: "blue",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            title: "Kata Sandi",
            desc: "Ubah password akun secara berkala",
            href: "/dashboard/akun",
            color: "amber",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            )
        },
        {
            title: "Sistem & Keamanan",
            desc: "Log aktivitas dan pengaturan sistem",
            href: "/dashboard/keamanan",
            color: "rose",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            title: "Bantuan",
            desc: "Panduan penggunaan dan dukungan klien",
            href: "/dashboard/bantuan",
            color: "cyan",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        }
    ];

    return (
        <div className="pb-24 lg:pb-0">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Pusat Pengaturan</h1>
                <p className="text-slate-400 text-sm">Kelola konfigurasi aplikasi dan profil bisnis Anda secara terpusat.</p>
            </div>

            {/* Subscription Banner */}
            <div className="bg-gradient-to-r from-[#2e1065] to-[#1e1b4b] rounded-3xl p-6 border border-white/5 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shrink-0 shadow-lg">
                        <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 16h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2zm1-8h12v1H6V8zm0 2h12v1H6v-1zm0 2h12v1H6v-1z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-black text-lg">Status Langganan</h3>
                        <p className="text-white/60 text-sm">Paket Aktif hingga {user?.subscription_expired_at ? new Date(user.subscription_expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                    </div>
                </div>
                <Link href="/billing" className="px-6 py-3 rounded-2xl bg-white text-[#2e1065] font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                    Perpanjang
                </Link>
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map((item, i) => (
                    <Link
                        key={i}
                        href={item.href}
                        className="group bg-[#1e293b] hover:bg-[#2e3b50] border border-slate-700 p-6 rounded-3xl flex items-center gap-5 transition-all active:scale-[0.98] shadow-lg hover:shadow-indigo-500/10"
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-${item.color}-500/10 text-${item.color}-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-white font-bold mb-0.5 truncate">{item.title}</h4>
                            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer Status */}
            <div className="mt-12 text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-50 italic">SmartKos Production Hub</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Operasional</span>
                </div>
            </div>
        </div>
    );
}
