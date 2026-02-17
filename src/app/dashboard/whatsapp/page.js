"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { replacePlaceholders } from "@/lib/whatsapp";

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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [templateId, setTemplateId] = useState(null);
    const supabase = createClient();

    useEffect(() => { fetchTemplate(); }, []);

    const fetchTemplate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("wa_templates").select("*").eq("user_id", user.id).single();
        if (data) {
            setTemplate(data.isi_template);
            setTemplateId(data.id);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (templateId) {
            await supabase.from("wa_templates").update({ isi_template: template }).eq("id", templateId);
        } else {
            const { data } = await supabase.from("wa_templates").insert({ user_id: user.id, isi_template: template }).select().single();
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
                <p className="text-slate-400">Customisasi template pesan tagihan WhatsApp Anda.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Template Pesan</h3>

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
                        rows={8}
                        className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                        placeholder="Tulis template pesan WhatsApp..."
                    />

                    <div className="flex items-center gap-3 mt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {saving ? "Menyimpan..." : "Simpan Template"}
                        </button>
                        {saved && (
                            <span className="text-sm text-emerald-400 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Tersimpan!
                            </span>
                        )}
                    </div>

                    {/* Placeholder info */}
                    <div className="mt-6 bg-[#0f172a] border border-[#334155] rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Keterangan Placeholder</h4>
                        <div className="space-y-2">
                            {PLACEHOLDERS.map((p) => (
                                <div key={p.key} className="flex items-center gap-2 text-xs">
                                    <code className="px-2 py-0.5 rounded bg-[#334155] text-indigo-400 font-mono">{p.key}</code>
                                    <span className="text-slate-400">→ {p.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Preview Pesan</h3>

                    <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5">
                        {/* Chat bubble */}
                        <div className="bg-emerald-900/30 border border-emerald-800/30 rounded-2xl rounded-tl-sm p-4 max-w-sm">
                            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{preview}</p>
                            <p className="text-[10px] text-slate-500 text-right mt-2">12:00 ✓✓</p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-[#0f172a] border border-[#334155] rounded-xl">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data Contoh</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <span className="text-slate-400">Nama:</span><span className="text-white">{SAMPLE_DATA.nama}</span>
                            <span className="text-slate-400">Bulan:</span><span className="text-white">{SAMPLE_DATA.bulan}</span>
                            <span className="text-slate-400">Jumlah:</span><span className="text-white">Rp {Number(SAMPLE_DATA.jumlah).toLocaleString("id-ID")}</span>
                            <span className="text-slate-400">Kamar:</span><span className="text-white">{SAMPLE_DATA.kamar}</span>
                            <span className="text-slate-400">Jatuh Tempo:</span><span className="text-white">Tanggal {SAMPLE_DATA.jatuh_tempo}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
