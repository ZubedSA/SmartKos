"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { replacePlaceholders } from "@/lib/whatsapp";
import Link from "next/link";

const PLACEHOLDERS = [
    { key: "{nama}", label: "Nama Penyewa" },
    { key: "{bulan}", label: "Bulan" },
    { key: "{jumlah}", label: "Jumlah Tagihan" },
    { key: "{kamar}", label: "Nomor Kamar" },
    { key: "{jatuh_tempo}", label: "Jatuh Tempo" },
];

const SAMPLE_DATA = {
    nama: "Ahmad Fauzi",
    bulan: "Februari",
    jumlah: 750000,
    kamar: "A3",
    jatuh_tempo: "10",
};

const DEFAULT_TEMPLATE = "Halo {nama}, ini adalah tagihan kos kamar {kamar} untuk bulan {bulan} sebesar Rp{jumlah}. Jatuh tempo tanggal {jatuh_tempo}. Terima kasih.";

export default function WhatsAppPage() {
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [apiKey, setApiKey] = useState("");
    const [autoReminder, setAutoReminder] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [templateId, setTemplateId] = useState(null);
    const supabase = createClient();

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        // Fetch user profile settings
        const { data: profile } = await supabase
            .from("users")
            .select("wa_api_key, wa_auto_reminder_enabled")
            .eq("id", authUser.id)
            .single();

        if (profile) {
            setApiKey(profile.wa_api_key || "");
            setAutoReminder(profile.wa_auto_reminder_enabled || false);
        }

        // Fetch template
        const { data: templateData } = await supabase
            .from("wa_templates")
            .select("*")
            .eq("user_id", authUser.id)
            .single();

        if (templateData) {
            setTemplate(templateData.isi_template);
            setTemplateId(templateData.id);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        // Update profile
        await supabase
            .from("users")
            .update({
                wa_api_key: apiKey,
                wa_auto_reminder_enabled: autoReminder
            })
            .eq("id", authUser.id);

        // Update template
        if (templateId) {
            await supabase.from("wa_templates").update({ isi_template: template }).eq("id", templateId);
        } else {
            const { data } = await supabase.from("wa_templates").insert({ user_id: authUser.id, isi_template: template }).select().single();
            if (data) setTemplateId(data.id);
        }

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const insertPlaceholder = (key) => {
        setTemplate((prev) => prev + key);
    };

    const preview = replacePlaceholders(template, SAMPLE_DATA);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Pengaturan WhatsApp</h1>
                <p className="text-slate-400">Hubungkan API WhatsApp dan kelola pengingat otomatis.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {/* Editor Settings */}
                <div className="space-y-6">
                    {/* API Settings */}
                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-white">Integrasi WhatsApp API</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Fonnte API Token</label>
                                    <Link href="/dashboard/whatsapp/tutorial" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Cara Integrasi
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="Masukkan token dari fonnte.com"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a] border border-[#334155]">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">Auto Reminder</span>
                                    <span className="text-[11px] text-slate-500">Kirim tagihan otomatis setiap hari</span>
                                </div>
                                <button
                                    onClick={() => setAutoReminder(!autoReminder)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoReminder ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoReminder ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Template Editor */}
                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-white">Template Pesan</h3>
                        </div>

                        {/* Placeholder buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {PLACEHOLDERS.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => insertPlaceholder(p.key)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
                                >
                                    {p.key}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                            placeholder="Tulis template pesan WhatsApp..."
                        />

                        <div className="flex items-center gap-3 mt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                            >
                                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                            </button>
                            {saved && (
                                <span className="text-sm text-emerald-400 flex items-center gap-1 animate-pulse">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Tersimpan!
                                </span>
                            )}
                        </div>

                        {/* Placeholder info */}
                        <div className="mt-6 bg-[#0f172a] border border-[#334155] rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Keterangan Variabel</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {PLACEHOLDERS.map((p) => (
                                    <div key={p.key} className="flex items-center gap-2 text-xs">
                                        <code className="px-1.5 py-0.5 rounded bg-[#334155] text-indigo-400 font-mono">{p.key}</code>
                                        <span className="text-slate-400">→ {p.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 h-fit sticky top-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Preview Tampilan</h3>

                    <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 mb-4 pattern-dots">
                        {/* Chat bubble */}
                        <div className="bg-emerald-900/40 border border-emerald-800/30 rounded-2xl rounded-tl-sm p-4 max-w-sm relative shadow-xl">
                            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{preview}</p>
                            <p className="text-[10px] text-emerald-500/60 text-right mt-2 font-medium">12:00 ✓✓</p>
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Tips</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">
                            Pastikan nomor WhatsApp penyewa sudah dalam format benar (contoh: 08123456789) agar pengingat otomatis dapat terkirim melalui sistem gateway Fonnte.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

