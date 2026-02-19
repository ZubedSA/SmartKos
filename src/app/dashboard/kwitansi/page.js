"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatRupiah } from "@/lib/whatsapp";

const SAMPLE_DATA = {
    no_kwitansi: "KW-202402001",
    nama_penyewa: "Andi Saputra",
    nomor_kamar: "B-05",
    nominal: 850000,
    keterangan: "Pembayaran Sewa Kamar - Februari 2024",
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
};

export default function KwitansiConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({
        nama_bisnis: "",
        alamat_bisnis: "",
        kontak_bisnis: "",
        pesan_tambahan: "Terima kasih telah melakukan pembayaran tepat waktu."
    });
    const [templateId, setTemplateId] = useState(null);

    const supabase = createClient();

    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("receipt_templates")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (data) {
            setFormData({
                nama_bisnis: data.nama_bisnis || "",
                alamat_bisnis: data.alamat_bisnis || "",
                kontak_bisnis: data.kontak_bisnis || "",
                pesan_tambahan: data.pesan_tambahan || ""
            });
            setTemplateId(data.id);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            if (templateId) {
                const { error } = await supabase
                    .from("receipt_templates")
                    .update(formData)
                    .eq("id", templateId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from("receipt_templates")
                    .insert([{ ...formData, user_id: user.id }])
                    .select()
                    .single();
                if (error) throw error;
                if (data) setTemplateId(data.id);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            alert("Gagal menyimpan: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Memuat konfigurasi...</div>;

    return (
        <div className="pb-24 lg:pb-0">
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Pengaturan Kwitansi</h1>
                <p className="text-slate-400">Sesuaikan header dan pesan pada bukti pembayaran (kwitansi).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Editor */}
                <div className="space-y-6">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Header Kwitansi
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Nama Kos / Bisnis</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: SmartKos Abadi"
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    value={formData.nama_bisnis}
                                    onChange={(e) => setFormData({ ...formData, nama_bisnis: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Alamat Properti</label>
                                <textarea
                                    rows={2}
                                    placeholder="Jl. Sukses No. 123, Bandung"
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                    value={formData.alamat_bisnis}
                                    onChange={(e) => setFormData({ ...formData, alamat_bisnis: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Kontak Telp / WA</label>
                                <input
                                    type="text"
                                    placeholder="0812-xxxx-xxxx"
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    value={formData.kontak_bisnis}
                                    onChange={(e) => setFormData({ ...formData, kontak_bisnis: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Pesan Penutup
                        </h3>
                        <textarea
                            rows={3}
                            placeholder="Tulis pesan tambahan di bawah kwitansi..."
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                            value={formData.pesan_tambahan}
                            onChange={(e) => setFormData({ ...formData, pesan_tambahan: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20"
                        >
                            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
                        </button>
                        {saved && (
                            <div className="px-4 py-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fadeScale">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Section */}
                <div>
                    <div className="sticky top-8">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-6 italic">Live Preview Cetak</p>

                        <div className="bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                            {/* Paper Texture Effect */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>

                            {/* Receipt Content */}
                            <div className="relative z-10 text-slate-900 font-serif">
                                <div className="text-center border-b-2 border-slate-900/10 pb-6 mb-8">
                                    <h2 className="text-xl font-black uppercase tracking-tighter mb-1">{formData.nama_bisnis || "NAMA KOS ANDA"}</h2>
                                    <p className="text-[10px] leading-relaxed opacity-70 italic max-w-xs mx-auto">
                                        {formData.alamat_bisnis || "Alamat lengkap properti akan tampil di sini..."}
                                    </p>
                                    <p className="text-[10px] font-bold mt-1">{formData.kontak_bisnis || "Telp: -"}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bukti Pembayaran</p>
                                            <h3 className="text-lg font-black">{SAMPLE_DATA.no_kwitansi}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] italic">{SAMPLE_DATA.tanggal}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-y border-slate-900/5 py-6">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-50">Nama Penyewa</span>
                                            <span className="font-bold">{SAMPLE_DATA.nama_penyewa}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-50">Nomor Kamar</span>
                                            <span className="font-bold">{SAMPLE_DATA.nomor_kamar}</span>
                                        </div>
                                        <div className="flex justify-between items-start text-xs">
                                            <span className="opacity-50">Keterangan</span>
                                            <span className="font-bold text-right max-w-[150px]">{SAMPLE_DATA.keterangan}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 flex justify-between items-center border-t-2 border-slate-900 text-lg">
                                        <span className="font-black uppercase tracking-tight">Total</span>
                                        <span className="font-black">Rp {formatRupiah(SAMPLE_DATA.nominal)}</span>
                                    </div>
                                </div>

                                <div className="text-center mt-12">
                                    <p className="text-[10px] italic opacity-60 px-4">
                                        "{formData.pesan_tambahan || "Terima kasih telah melakukan pembayaran tepat waktu."}"
                                    </p>
                                    <div className="mt-8 pt-8 border-t border-slate-900/5">
                                        <div className="inline-block px-4 py-2 border-2 border-emerald-500 text-emerald-500 font-black text-[10px] rounded-lg rotate-[-12deg] opacity-40">
                                            LUNAS / PAID
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] -rotate-45 font-black text-[6rem] pointer-events-none select-none">
                                SMARTKOS
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
