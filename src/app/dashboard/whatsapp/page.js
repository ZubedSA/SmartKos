"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { replacePlaceholders, parseTemplateConfig, buildTemplateConfig } from "@/lib/whatsapp";
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

const DEFAULT_TEMPLATE = "Halo {nama}, ini adalah tagihan sewa kos kamar {kamar} untuk bulan {bulan} sebesar Rp {jumlah}. Jatuh tempo tanggal {jatuh_tempo}. Terima kasih.";

export default function WhatsAppPage() {
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [apiKey, setApiKey] = useState("");
    const [autoReminder, setAutoReminder] = useState(false);
    const [reminderStages, setReminderStages] = useState({
        h3: true,
        hariH: true,
        overdue: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [templateId, setTemplateId] = useState(null);
    const supabase = createClient();

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            let initialStages = { h3: true, hariH: true, overdue: true };

            // Fetch user profile settings
            const { data: profile } = await supabase
                .from("users")
                .select("*")
                .eq("id", authUser.id)
                .single();

            if (profile) {
                setApiKey(profile.wa_api_key || "");
                setAutoReminder(profile.wa_auto_reminder_enabled || false);
                if (profile.wa_reminder_h3 !== undefined && profile.wa_reminder_h3 !== null) {
                    initialStages.h3 = Boolean(profile.wa_reminder_h3);
                }
                if (profile.wa_reminder_hari_h !== undefined && profile.wa_reminder_hari_h !== null) {
                    initialStages.hariH = Boolean(profile.wa_reminder_hari_h);
                }
                if (profile.wa_reminder_overdue !== undefined && profile.wa_reminder_overdue !== null) {
                    initialStages.overdue = Boolean(profile.wa_reminder_overdue);
                }
            }

            // Fetch template
            const { data: templateData } = await supabase
                .from("wa_templates")
                .select("*")
                .eq("user_id", authUser.id)
                .single();

            if (templateData) {
                const parsedConfig = parseTemplateConfig(templateData.isi_template);
                setTemplate(parsedConfig.template);
                setTemplateId(templateData.id);

                // If user table doesn't have custom stage columns, fallback to template config
                if (profile?.wa_reminder_h3 === undefined || profile?.wa_reminder_h3 === null) {
                    initialStages = parsedConfig.stages;
                }
            }

            setReminderStages(initialStages);
        } catch (error) {
            console.error("Error fetching WA settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            // 1. Update user profile (dengan fallback jika kolom DB belum di-migrate)
            try {
                await supabase
                    .from("users")
                    .update({
                        wa_api_key: apiKey,
                        wa_auto_reminder_enabled: autoReminder,
                        wa_reminder_h3: reminderStages.h3,
                        wa_reminder_hari_h: reminderStages.hariH,
                        wa_reminder_overdue: reminderStages.overdue
                    })
                    .eq("id", authUser.id);
            } catch (err) {
                // Fallback update basic columns
                await supabase
                    .from("users")
                    .update({
                        wa_api_key: apiKey,
                        wa_auto_reminder_enabled: autoReminder
                    })
                    .eq("id", authUser.id);
            }

            // 2. Update wa_templates dengan payload JSON berisi template & stage config
            const templatePayload = buildTemplateConfig(template, reminderStages);

            if (templateId) {
                await supabase.from("wa_templates").update({ 
                    isi_template: templatePayload
                }).eq("id", templateId);
            } else {
                const { data } = await supabase.from("wa_templates").insert({ 
                    user_id: authUser.id, 
                    isi_template: templatePayload
                }).select().single();
                if (data) setTemplateId(data.id);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error saving WA settings:", error);
            alert("Gagal menyimpan pengaturan: " + error.message);
        } finally {
            setSaving(false);
        }
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
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Pengaturan WhatsApp</h1>
                <p className="text-slate-400 text-sm">Kelola integrasi gateway WhatsApp, template pesan, dan pengingat otomatis.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: API Settings & Reminder Stages */}
                <div className="space-y-6">
                    {/* API Configuration Card */}
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

                            {/* Main Auto Reminder Toggle */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0f172a] border border-[#334155]">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white">Auto Reminder (Fonnte)</span>
                                    <span className="text-[11px] text-slate-400">Jalankan pengingat otomatis berkala setiap hari</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAutoReminder(!autoReminder)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoReminder ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoReminder ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Granular Sub-toggles: H-3, Hari-H, Menunggak */}
                            <div className={`p-4 rounded-xl border transition-all ${autoReminder ? "bg-slate-900/80 border-slate-700/80" : "bg-slate-900/30 border-slate-800 opacity-50 pointer-events-none"}`}>
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/40">
                                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Pilihan Tahap Pengingat
                                    </span>
                                    <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                        Granular
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {/* Tahap 1: Pengingat H-3 */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-base leading-none mt-0.5">🔔</span>
                                            <div>
                                                <p className="text-xs font-semibold text-white">Pengingat H-3</p>
                                                <p className="text-[11px] text-slate-400">Kirim pemberitahuan sopan 3 hari sebelum jatuh tempo</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReminderStages(prev => ({ ...prev, h3: !prev.h3 }))}
                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${reminderStages.h3 ? 'bg-amber-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${reminderStages.h3 ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* Tahap 2: Pengingat Hari-H */}
                                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-800">
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-base leading-none mt-0.5">📢</span>
                                            <div>
                                                <p className="text-xs font-semibold text-white">Pengingat Hari-H</p>
                                                <p className="text-[11px] text-slate-400">Kirim penegasan tepat di tanggal jatuh tempo</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReminderStages(prev => ({ ...prev, hariH: !prev.hariH }))}
                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${reminderStages.hariH ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${reminderStages.hariH ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* Tahap 3: Teguran Menunggak */}
                                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-800">
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-base leading-none mt-0.5">⚠️</span>
                                            <div>
                                                <p className="text-xs font-semibold text-white">Teguran Menunggak</p>
                                                <p className="text-[11px] text-slate-400">Kirim pesan otomatis jika telah melewati tanggal jatuh tempo</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReminderStages(prev => ({ ...prev, overdue: !prev.overdue }))}
                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${reminderStages.overdue ? 'bg-rose-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${reminderStages.overdue ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                {!reminderStages.h3 && !reminderStages.hariH && !reminderStages.overdue && autoReminder && (
                                    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span>Semua tahap dimatikan. Pengingat otomatis tidak akan dikirim.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Template Editor & Preview */}
                <div className="space-y-6">
                    {/* Template Editor */}
                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-white">Template Pesan Utama</h3>
                        </div>

                        {/* Placeholder buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {PLACEHOLDERS.map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
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
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
                            placeholder="Tulis template pesan WhatsApp..."
                        />

                        <div className="flex items-center gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 text-sm"
                            >
                                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                            </button>
                            {saved && (
                                <span className="text-sm text-emerald-400 flex items-center gap-1 animate-pulse">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Pengaturan Tersimpan!
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

                    {/* Preview Card */}
                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-white">Pratinjau Pesan</h3>
                        </div>

                        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#334155]">
                                <div className="w-8 h-8 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold text-xs">
                                    WA
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-white">{SAMPLE_DATA.nama}</p>
                                    <p className="text-[10px] text-slate-500">Penyewa Kamar {SAMPLE_DATA.kamar}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {preview}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
