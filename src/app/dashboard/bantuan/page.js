"use client";

import { useState } from "react";

export default function BantuanPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            q: "Bagaimana cara menambahkan kos baru?",
            a: "Anda dapat menekan tombol 'Tambah Kos' di Dashboard utama atau buka menu 'Kos' di bilah navigasi dan tekan 'Tambah Kos Baru'. Cukup lengkapi data bangunan seperti nama kos, jumlah lantai, alamat, dan fasilitas yang disediakan.",
            category: "kos"
        },
        {
            q: "Bagaimana cara memasukkan penyewa ke kamar?",
            a: "Pertama, pastikan Anda sudah menambahkan kamar di menu 'Kamar' (pastikan statusnya 'Kosong'). Kemudian, buka menu 'Penyewa', klik 'Tambah Penyewa', isi data diri penyewa, pilih kamar yang ingin ditempati, lalu simpan. Status kamar akan otomatis berubah menjadi 'Terisi'.",
            category: "penyewa"
        },
        {
            q: "Bagaimana cara membuat dan mengirim tagihan?",
            a: "Buka menu 'Tagihan' kemudian pilih 'Buat Tagihan'. Pilih nama penyewa, lengkapi detail nominal sewa dan tanggal jatuh tempo. Setelah disimpan, Anda dapat langsung mengirimkan pengingat tagihan ke WhatsApp penyewa dengan menekan tombol 'Kirim WA' pada baris tagihan terkait.",
            category: "tagihan"
        },
        {
            q: "Bagaimana cara mengatur fitur WhatsApp otomatis?",
            a: "Masuk ke menu 'Pengaturan WA' di sidebar. Di sana Anda dapat mengisi pengaturan API Gateway/Fonnte, melacak status koneksi nomor Anda, serta menyesuaikan template pesan tagihan atau kwitansi agar sesuai dengan gaya bahasa Anda.",
            category: "whatsapp"
        },
        {
            q: "Mengapa status kamar tidak berubah setelah penyewa keluar?",
            a: "Ketika masa sewa penyewa berakhir dan mereka keluar dari kos, Anda perlu mengubah status penyewa tersebut menjadi non-aktif atau menghapusnya dari kamar terkait melalui menu 'Penyewa' dengan menekan tombol edit/keluarkan. Status kamar akan otomatis kembali menjadi 'Kosong'.",
            category: "kamar"
        },
        {
            q: "Bagaimana cara mencatat pengeluaran operasional?",
            a: "Anda dapat mencatat biaya perawatan, listrik umum, atau perbaikan kos di menu 'Operasional'. Pilih 'Catat Biaya', masukkan jenis pengeluaran, jumlah nominal, tanggal, dan deskripsi singkat. Seluruh data ini akan otomatis memotong kalkulasi laba bersih di menu 'Laporan'.",
            category: "laporan"
        }
    ];

    const toggleFaq = (index) => {
        if (openFaq === index) {
            setOpenFaq(null);
        } else {
            setOpenFaq(index);
        }
    };

    const handleWhatsAppContact = (topic) => {
        let templateMessage = "";
        switch (topic) {
            case "kendala":
                templateMessage = "Halo Admin SmartKos, saya mendapati kendala teknis saat mengoperasikan aplikasi SmartKos. Mohon bantuan bimbingannya.";
                break;
            case "fitur":
                templateMessage = "Halo Admin SmartKos, saya ingin bertanya lebih lanjut seputar fitur-fitur di SmartKos.";
                break;
            case "langganan":
                templateMessage = "Halo Admin SmartKos, saya ingin mengonfirmasi / memperpanjang langganan SmartKos saya.";
                break;
            default:
                templateMessage = "Halo Admin SmartKos, saya memerlukan bantuan terkait aplikasi.";
        }
        
        const waUrl = `https://wa.me/6281717594886?text=${encodeURIComponent(templateMessage)}`;
        window.open(waUrl, "_blank");
    };

    const filteredFaqs = faqs.filter(
        faq =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header Area */}
            <div className="bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] rounded-3xl p-8 lg:p-12 border border-[#3b0764]/40 text-center text-white mb-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-xl">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight mb-3">Pusat Bantuan & Panduan</h1>
                    <p className="text-slate-300 max-w-xl mx-auto text-sm lg:text-base">
                        Temukan jawaban cepat atas pertanyaan Anda atau hubungi dukungan teknis langsung melalui WhatsApp.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto mt-8 relative">
                        <input
                            type="text"
                            placeholder="Cari solusi atau pertanyaan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-5 py-4 pl-12 rounded-2xl bg-[#0f172a]/60 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner backdrop-blur-md"
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: FAQs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 lg:p-8 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            Pertanyaan Umum (FAQ)
                        </h2>

                        {filteredFaqs.length > 0 ? (
                            <div className="space-y-4">
                                {filteredFaqs.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="border border-slate-700/50 rounded-xl overflow-hidden bg-[#0f172a]/40 transition-all hover:border-slate-600/50"
                                    >
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="w-full flex items-center justify-between p-4 text-left font-medium text-white hover:text-indigo-400 transition-colors"
                                        >
                                            <span className="text-sm lg:text-base pr-4">{faq.q}</span>
                                            <svg
                                                className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === index ? "rotate-180 text-indigo-400" : ""}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        <div
                                            className={`transition-all duration-300 overflow-hidden ${openFaq === index ? "max-h-60 border-t border-slate-700/50" : "max-h-0"}`}
                                        >
                                            <p className="p-4 text-sm text-slate-300 leading-relaxed bg-[#0f172a]/20">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <svg className="w-12 h-12 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-semibold text-white mb-1">Pencarian tidak ditemukan</p>
                                <p className="text-sm">Silakan gunakan kata kunci lain atau hubungi admin di kanan.</p>
                            </div>
                        )}
                    </div>

                    {/* Step by Step Guide */}
                    <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 lg:p-8 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                            Panduan Cepat Mulai SmartKos
                        </h2>

                        <div className="relative border-l-2 border-slate-700 ml-3 space-y-8 py-2">
                            {/* Step 1 */}
                            <div className="relative pl-8">
                                <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                                    1
                                </div>
                                <h3 className="text-white font-bold text-base mb-1">Dafrarkan Properti Kos</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Buka menu <span className="text-indigo-400 font-medium">Kos</span> dan isi form data kos baru seperti nama, alamat, tipe kos, dan jumlah lantai/kamar.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative pl-8">
                                <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                                    2
                                </div>
                                <h3 className="text-white font-bold text-base mb-1">Tambah Data Kamar</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Masuk ke menu <span className="text-indigo-400 font-medium">Kamar</span>, lalu klik buat kamar baru. Daftarkan nomor kamar serta harga sewa masing-masing kamar.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative pl-8">
                                <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                                    3
                                </div>
                                <h3 className="text-white font-bold text-base mb-1">Daftarkan Penyewa</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Buka menu <span className="text-indigo-400 font-medium">Penyewa</span> untuk menambahkan nama penyewa, nomor handphone aktif, dan tentukan kamar yang akan dihuni.
                                </p>
                            </div>

                            {/* Step 4 */}
                            <div className="relative pl-8">
                                <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                                    4
                                </div>
                                <h3 className="text-white font-bold text-base mb-1">Kelola Tagihan & Laporan</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Secara berkala, buat tagihan sewa di menu <span className="text-indigo-400 font-medium">Tagihan</span> dan kirimkan pengingat tagihan ke WhatsApp penyewa. Pantau laba bersih kos Anda di menu <span className="text-indigo-400 font-medium">Laporan</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Contact Cards */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                        
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            Hubungi Admin WA
                        </h2>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Butuh bantuan lebih cepat atau ada kendala sistem? Silakan hubungi admin SmartKos di <strong>0817-1759-4886</strong>.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleWhatsAppContact("kendala")}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 text-slate-300 text-sm font-medium transition-all group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Ada Kendala Sistem
                                </span>
                                <svg className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => handleWhatsAppContact("fitur")}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 text-slate-300 text-sm font-medium transition-all group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Tanya Cara Penggunaan
                                </span>
                                <svg className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => handleWhatsAppContact("langganan")}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/30 text-[#25d366] text-sm font-semibold transition-all group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                    </svg>
                                    Konfirmasi Langganan
                                </span>
                                <svg className="w-4 h-4 text-[#25d366] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* About Card */}
                    <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 shadow-xl text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-base mb-1">SmartKos App</h3>
                        <p className="text-slate-400 text-xs mb-3">Versi 1.0.0 (Trial Aktif)</p>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            SmartKos dirancang untuk mempermudah operasional kos harian, penagihan digital, dan rekap keuangan otomatis Anda.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
