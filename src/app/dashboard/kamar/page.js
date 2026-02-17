"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { createClient } from "@/lib/supabase";

export default function KamarPage() {
    const [kamarList, setKamarList] = useState([]);
    const [kosList, setKosList] = useState([]);
    const [selectedKos, setSelectedKos] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    // Removed 'status' from form state as it is now auto-calculated
    const [form, setForm] = useState({ kos_id: "", nomor: "", harga: "" });
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (kosList.length > 0) fetchKamar();
    }, [selectedKos, kosList]);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: kos } = await supabase.from("kos").select("*").eq("user_id", user.id).order("nama_kos");
        setKosList(kos || []);
        setLoading(false);
    };

    const fetchKamar = async () => {
        let query = supabase.from("kamar").select("*, kos!inner(nama_kos, user_id)");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        query = query.eq("kos.user_id", user.id);
        if (selectedKos) query = query.eq("kos_id", selectedKos);
        query = query.order("nomor");
        const { data } = await query;
        setKamarList(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, harga: parseInt(form.harga) || 0 };

        if (editItem) {
            // Status is NOT updated here manually
            await supabase.from("kamar").update(payload).eq("id", editItem.id);
        } else {
            // New kamar defaults to 'Kosong' (handled by DB default)
            await supabase.from("kamar").insert(payload);
        }
        closeModal();
        fetchKamar();
    };

    const handleDelete = async (item) => {
        if (!confirm("Yakin ingin menghapus kamar ini?")) return;
        await supabase.from("kamar").delete().eq("id", item.id);
        fetchKamar();
    };

    const openEdit = (item) => {
        setEditItem(item);
        // Load existing data, ignore status for editing
        setForm({ kos_id: item.kos_id, nomor: item.nomor, harga: String(item.harga) });
        setShowModal(true);
    };

    const openAdd = () => {
        setForm({ kos_id: selectedKos || (kosList[0]?.id || ""), nomor: "", harga: "" });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setForm({ kos_id: "", nomor: "", harga: "" });
    };

    const formatRupiah = (val) => Number(val).toLocaleString("id-ID");

    const columns = [
        { key: "nomor", label: "Nomor Kamar" },
        {
            key: "kos",
            label: "Kos",
            render: (val) => val?.nama_kos || "-",
        },
        {
            key: "harga",
            label: "Harga",
            render: (val) => <span className="font-medium">Rp {formatRupiah(val)}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (val) => {
                const isKosong = val === "Kosong" || val === "kosong";
                return (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${!isKosong
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-500/20 text-slate-400"
                        }`}>
                        {val}
                    </span>
                );
            },
        },
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Kelola Kamar</h1>
                    <p className="text-slate-400">Atur kamar untuk setiap properti kos Anda.</p>
                </div>
                <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Kamar
                </button>
            </div>

            {/* Filter */}
            <div className="mb-6">
                <select
                    value={selectedKos}
                    onChange={(e) => setSelectedKos(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-[#1e293b] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Semua Kos</option>
                    {kosList.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama_kos}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={kamarList}
                    emptyMessage="Belum ada kamar."
                    actions={(row) => (
                        <>
                            <button onClick={() => openEdit(row)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button onClick={() => handleDelete(row)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </>
                    )}
                />
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editItem ? "Edit Kamar" : "Tambah Kamar"}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Kos</label>
                        <select
                            value={form.kos_id}
                            onChange={(e) => setForm({ ...form, kos_id: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Pilih Kos</option>
                            {kosList.map((k) => (
                                <option key={k.id} value={k.id}>{k.nama_kos}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nomor Kamar</label>
                        <input type="text" value={form.nomor} onChange={(e) => setForm({ ...form, nomor: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: A1, 101" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Harga / Bulan</label>
                        <input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="500000" />
                    </div>

                    {/* Status input removed - auto calculated based on tenants */}

                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors">Batal</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all">{editItem ? "Simpan" : "Tambah"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
