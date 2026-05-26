"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LandingPage() {
    const [activeFaq, setActiveFaq] = useState(null);

    const faqs = [
        {
            q: "Apa itu SmartKos?",
            a: "SmartKos adalah platform digital asisten manajemen rumah kos yang dirancang khusus untuk pemilik kos (owner). Aplikasi ini membantu pencatatan data kos, kamar, penyewa, kas masuk/keluar, hingga pengiriman pengingat tagihan sewa otomatis secara langsung melalui WhatsApp."
        },
        {
            q: "Bagaimana cara kerja tagihan otomatis via WhatsApp?",
            a: "Sistem mengintegrasikan WhatsApp API (Fonnte). Anda hanya perlu membuat tagihan sewa di menu dashboard, lalu menekan tombol kirim. Sistem akan otomatis merakit pesan tagihan personal dengan nama penyewa, nomor kamar, nominal sewa, dan mengirimkannya langsung ke nomor WhatsApp penyewa."
        },
        {
            q: "Apakah saya mendapatkan masa uji coba gratis?",
            a: "Ya! Setiap akun baru yang didaftarkan akan otomatis mendapatkan Paket Trial Premium Gratis selama 30 Hari penuh. Anda dapat mencoba seluruh fitur tanpa batasan apa pun."
        },
        {
            q: "Bagaimana jika saya memerlukan bantuan teknis?",
            a: "SmartKos memiliki Pusat Bantuan terintegrasi di dalam aplikasi. Anda juga dapat menghubungi Tim Dukungan kami secara langsung melalui WhatsApp ke nomor 0817-1759-4886."
        }
    ];

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[130px]" />
                <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Navigation Header */}
            <header className="relative z-20 border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md sticky top-0 shadow-lg shadow-black/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-800/40 border border-slate-700/60 p-1 sm:p-1.5 flex items-center justify-center shadow-lg shadow-black/20 group-hover:border-indigo-500/50 group-hover:bg-[#1e1b4b]/20 transition-all duration-300 shrink-0">
                            <Logo className="w-full h-full drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="flex flex-col shrink-0">
                            <span className="text-base sm:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-200 tracking-tight leading-none">
                                SmartKos
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-black text-indigo-400 tracking-[0.2em] uppercase mt-1 leading-none hidden sm:block">
                                DIGITAL HUB
                            </span>
                        </div>
                    </Link>

                    {/* Nav Links Desktop */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
                        <a href="#fitur" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Fitur Utama
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-200" />
                        </a>
                        <a href="#pricing" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Harga Paket
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-200" />
                        </a>
                        <a href="#faq" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Tanya Jawab
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-200" />
                        </a>
                        <a href="https://wa.me/6281717594886" target="_blank" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Hubungi Kami
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-200" />
                        </a>
                    </nav>

                    {/* CTA Action Buttons */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <Link
                            href="/login"
                            className="text-[10px] sm:text-xs md:text-sm font-bold border border-slate-700/80 hover:border-slate-500/80 bg-slate-800/20 hover:bg-slate-800/60 text-slate-300 hover:text-white px-3.5 sm:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full transition-all duration-200 active:scale-95 whitespace-nowrap"
                        >
                            Masuk
                        </Link>
                        <Link
                            href="/register"
                            className="text-[10px] sm:text-xs md:text-sm font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 sm:px-5.5 py-1.5 sm:py-2 md:py-2.5 rounded-full hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap active:scale-95"
                        >
                            Daftar Sekarang
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 lg:pt-32 pb-20 text-center">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Trial Gratis Selama 30 Hari
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1] max-w-4xl mx-auto">
                    Kelola Rumah Kos Jadi <br className="hidden md:inline" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Mudah & Otomatis
                    </span>
                </h1>
                
                <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                    Solusi terpadu asisten bisnis kos Anda. Atur bangunan & kamar, catat penyewa aktif, hitung kas masuk-keluar harian, hingga penagihan sewa otomatis langsung ke WhatsApp penyewa.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
                    <Link
                        href="/register"
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-base tracking-wide hover:from-indigo-600 hover:to-purple-700 transition-all shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Mulai Trial Gratis
                    </Link>
                    <a
                        href="#fitur"
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition-all border border-slate-750 active:scale-95"
                    >
                        Pelajari Fitur
                    </a>
                </div>

                {/* Dashboard App Preview Showcase (Mockup) */}
                <div className="max-w-5xl mx-auto rounded-3xl p-3 bg-slate-800/40 border border-slate-700/60 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10" />
                    
                    {/* Mockup Header Bar */}
                    <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0f172a]/60 border-b border-slate-800 rounded-t-2xl">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        <span className="text-[10px] font-mono text-slate-500 ml-4">https://smartkos.com/dashboard</span>
                    </div>
                    
                    {/* Simulated Content Grid */}
                    <div className="bg-[#0f172a] p-6 lg:p-8 rounded-b-2xl grid grid-cols-1 md:grid-cols-3 gap-6 text-left min-h-[300px] pointer-events-none">
                        {/* Stats card mock */}
                        <div className="p-5 rounded-2xl bg-[#1e293b] border border-slate-700 flex flex-col justify-between h-40">
                            <div>
                                <span className="text-slate-400 text-xs font-semibold">Okupansi Kamar</span>
                                <h3 className="text-3xl font-black text-white mt-2">12 / 15</h3>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-lg w-fit">Terisi 80%</span>
                        </div>
                        {/* Tagihan card mock */}
                        <div className="p-5 rounded-2xl bg-[#1e293b] border border-slate-700 flex flex-col justify-between h-40">
                            <div>
                                <span className="text-slate-400 text-xs font-semibold">Tagihan Belum Lunas</span>
                                <h3 className="text-3xl font-black text-rose-400 mt-2">Rp 3.500.000</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Dari 3 Penyewa Aktif</span>
                        </div>
                        {/* WA reminder status mock */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#1e293b] border border-indigo-500/30 flex flex-col justify-between h-40 relative">
                            <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                                <span className="text-slate-300 text-xs font-bold">API WhatsApp Gateway</span>
                                <h3 className="text-xl font-bold text-white mt-1">Koneksi Aktif</h3>
                                <p className="text-slate-400 text-[10px] mt-1">Nomor Pengirim: 0812-xxxx-xxxx</p>
                            </div>
                            <span className="text-[10px] text-indigo-300 font-black uppercase tracking-wider">FONNTE INTEGRATED</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Grid */}
            <section id="fitur" className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 border-t border-slate-800/80">
                <div className="text-center mb-16">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">Fitur Andalan Pengelola Kos</h2>
                    <p className="text-slate-400 text-sm max-w-xl mx-auto">Dirancang untuk menjawab seluruh kebutuhan operasional kos secara cepat, efisien, dan modern.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Feature 1 */}
                    <div className="p-6 rounded-3xl bg-[#1e293b]/50 border border-slate-700/50 hover:border-indigo-500/40 hover:bg-[#1e293b] transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-base mb-2">Tagihan WA Otomatis</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Kirim pengingat sewa bulanan dan kwitansi lunas lewat pesan WhatsApp personal secara otomatis dalam hitungan detik.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="p-6 rounded-3xl bg-[#1e293b]/50 border border-slate-700/50 hover:border-indigo-500/40 hover:bg-[#1e293b] transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-base mb-2">Manajemen Properti</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Atur seluruh informasi data gedung kos, status isi/kosong kamar, serta harga sewa masing-masing unit kamar kos secara terpusat.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-6 rounded-3xl bg-[#1e293b]/50 border border-slate-700/50 hover:border-indigo-500/40 hover:bg-[#1e293b] transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-base mb-2">Basis Data Penyewa</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Catat data penyewa aktif, histori pembayaran, informasi nomor HP aktif, hingga tanggal jatuh tempo pembayaran sewa bulanan.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="p-6 rounded-3xl bg-[#1e293b]/50 border border-slate-700/50 hover:border-indigo-500/40 hover:bg-[#1e293b] transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-base mb-2">Kas & Laporan Laba</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Pencatatan kas masuk operasional otomatis, biaya perawatan rutin kos, dan grafik rekapitulasi untung rugi (laba bersih) kos.
                        </p>
                    </div>
                </div>
            </section>

            {/* Subscription pricing overview */}
            <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 border-t border-slate-800/80 text-center">
                <div className="mb-16">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">Investasi Hemat & Terjangkau</h2>
                    <p className="text-slate-400 text-sm max-w-xl mx-auto">Tanpa komitmen jangka panjang yang memberatkan. Pilihlah paket langganan terbaik untuk kemudahan bisnis kos Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Plan 1 */}
                    <div className="bg-[#1e293b]/70 border border-slate-700/60 rounded-3xl p-8 flex flex-col justify-between text-left shadow-xl">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-2">Paket Bulanan</h3>
                            <p className="text-slate-400 text-xs mb-6">Cocok untuk mencoba seluruh fitur.</p>
                            <h4 className="text-white text-3xl font-black mb-1">Rp 50.000<span className="text-slate-500 text-sm font-semibold">/ bln</span></h4>
                        </div>
                        <Link href="/register" className="w-full text-center py-3 bg-[#334155] hover:bg-[#475569] text-white text-xs font-bold uppercase rounded-xl transition-colors mt-8">
                            Mulai Trial Gratis
                        </Link>
                    </div>

                    {/* Plan 2 */}
                    <div className="bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] border border-indigo-500 rounded-3xl p-8 flex flex-col justify-between text-left shadow-2xl relative scale-105">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">Paling Populer</span>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-2">Paket Tahunan</h3>
                            <p className="text-slate-400 text-xs mb-6">Investasi hemat ketenangan kelola kos.</p>
                            <h4 className="text-white text-3xl font-black mb-1">Rp 480.000<span className="text-slate-500 text-sm font-semibold">/ thn</span></h4>
                            <span className="text-[10px] font-bold text-indigo-300">Setara Rp 40.000 / bulan</span>
                        </div>
                        <Link href="/register" className="w-full text-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md mt-8">
                            Daftar Sekarang
                        </Link>
                    </div>

                    {/* Plan 3 */}
                    <div className="bg-[#1e293b]/70 border border-slate-700/60 rounded-3xl p-8 flex flex-col justify-between text-left shadow-xl">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-2">Paket Semesteran</h3>
                            <p className="text-slate-400 text-xs mb-6">Solusi hemat jangka menengah.</p>
                            <h4 className="text-white text-3xl font-black mb-1">Rp 270.000<span className="text-slate-500 text-sm font-semibold">/ 6 bln</span></h4>
                        </div>
                        <Link href="/register" className="w-full text-center py-3 bg-[#334155] hover:bg-[#475569] text-white text-xs font-bold uppercase rounded-xl transition-colors mt-8">
                            Mulai Trial Gratis
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 border-t border-slate-800/80 text-center">
                <div className="mb-16">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">Kata Owner Kos Yang Menggunakan</h2>
                    <p className="text-slate-400 text-sm max-w-xl mx-auto">Ulasan jujur dari rekan pengusaha kos yang kini bisa santai menagih bulanan.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                    <div className="p-6 rounded-3xl bg-[#1e293b]/40 border border-slate-700/50 shadow-lg">
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                            "Sebelum pakai SmartKos, penagihan kos 50 kamar butuh waktu 3 hari karena harus WA manual satu-satu. Sekarang tinggal input tagihan dan tekan kirim, tagihan langsung meluncur ke WhatsApp penyewa. Laporan keuangannya juga sangat detail!"
                        </p>
                        <h4 className="text-white font-bold text-sm">Ibu Endang</h4>
                        <span className="text-slate-500 text-xs">Owner Kos Ibu Endang (50 Kamar), Bandung</span>
                    </div>

                    <div className="p-6 rounded-3xl bg-[#1e293b]/40 border border-slate-700/50 shadow-lg">
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                            "Fitur operasional dan laba bersihnya mantap sekali. Saya bisa dengan mudah memantau pengeluaran listrik token umum dan biaya perbaikan keran bocor. Aplikasi ini sangat direkomendasikan untuk pemilik kos sibuk."
                        </p>
                        <h4 className="text-white font-bold text-sm">Pak Budi</h4>
                        <span className="text-slate-500 text-xs">Owner Kos Berkah Mulia (24 Kamar), Jakarta</span>
                    </div>
                </div>
            </section>

            {/* FAQs Accordion */}
            <section id="faq" className="relative z-10 max-w-3xl mx-auto px-6 py-20 lg:py-32 border-t border-slate-800/80">
                <div className="text-center mb-16">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">Pertanyaan Populer</h2>
                    <p className="text-slate-400 text-sm">Punya pertanyaan seputar SmartKos? Temukan jawabannya di bawah ini.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className="border border-slate-700/60 rounded-2xl bg-[#1e293b]/20 overflow-hidden transition-all">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-white hover:text-indigo-400 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-indigo-400" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-60 border-t border-slate-800/80" : "max-h-0"}`}>
                                    <p className="p-5 text-xs sm:text-sm text-slate-400 leading-relaxed bg-[#0f172a]/20">
                                        {faq.a}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Footer Bottom Banner CTA */}
            <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
                <div className="bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] rounded-3xl p-8 lg:p-12 border border-[#3b0764]/40 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10">
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">Siap Mengelola Kos Secara Digital?</h2>
                        <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                            Bergabunglah bersama ratusan pengusaha kos modern lainnya sekarang. Coba gratis 30 hari pertama, tanpa perlu kartu kredit!
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex px-8 py-4 rounded-2xl bg-white text-[#0f172a] font-extrabold text-base tracking-wide hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                        >
                            Mulai Trial Gratis Sekarang
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer bottom links */}
            <footer className="relative z-20 border-t border-slate-800/85 bg-[#0f172a] py-12 text-slate-500 text-xs">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8" />
                        <span className="font-extrabold text-slate-300">SmartKos app © 2026.</span>
                    </div>

                    <div className="flex gap-6 text-slate-400">
                        <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
                        <a href="#faq" className="hover:text-white transition-colors">Bantuan FAQ</a>
                        <a href="https://wa.me/6281717594886" target="_blank" className="hover:text-white transition-colors">WhatsApp Hub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
