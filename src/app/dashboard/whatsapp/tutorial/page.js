"use client";

import Link from "next/link";

const STEPS = [
    {
        title: "Registrasi Fonnte",
        desc: "Daftar akun di fonnte.com dan pastikan Anda memiliki saldo atau paket aktif.",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        )
    },
    {
        title: "Hubungkan WhatsApp",
        desc: "Masuk ke menu 'Device', tambah perangkat, lalu scan QR Code menggunakan WhatsApp HP Anda.",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        )
    },
    {
        title: "Salin API Token",
        desc: "Cari bagian 'API Token' di dashboard Fonnte Anda dan salin kode tersebut.",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
        )
    },
    {
        title: "Simpan di SmartKos",
        desc: "Tempel API Token di halaman Pengaturan WhatsApp SmartKos dan aktifkan Auto Reminder.",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        )
    }
];

export default function WAGuidePage() {
    return (
        <div className="max-w-3xl mx-auto pb-20">
            <Link href="/dashboard/whatsapp" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-6 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Pengaturan
            </Link>

            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Panduan Integrasi WhatsApp</h1>
                <p className="text-slate-400">Ikuti langkah-langkah di bawah ini untuk mengaktifkan fitur pengingat otomatis.</p>
            </div>

            <div className="space-y-4">
                {STEPS.map((step, index) => (
                    <div key={index} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                            {step.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Langkah {index + 1}</span>
                                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20">
                <h4 className="text-indigo-300 font-bold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Butuh Bantuan Lebih?
                </h4>
                <p className="text-slate-400 text-sm mb-4">
                    Kunjungi situs dokumentasi resmi Fonnte untuk detail penggunaan API yang lebih mendalam atau hubungi pengembang jika Anda mengalami kendala teknis.
                </p>
                <a
                    href="https://fonnte.com"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                >
                    Buka Fonnte.com
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
    );
}
