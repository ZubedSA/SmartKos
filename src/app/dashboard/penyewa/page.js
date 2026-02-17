"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { createClient } from "@/lib/supabase";

export default function PenyewaPage() {
    const [penyewaList, setPenyewaList] = useState([]);
    const [kamarList, setKamarList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ kamar_id: "", nama: "", no_hp: "", tanggal_masuk: "", jatuh_tempo: 1 });
    const supabase = createClient();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [penyewaRes, kamarRes] = await Promise.all([
            supabase.from("penyewa").select("*, kamar!inner(nomor, harga, kos!inner(nama_kos, user_id))").eq("kamar.kos.user_id", user.id).order("created_at", { ascending: false }),
            // Removed .eq("status", "kosong") to allow selection of occupied rooms
            supabase.from("kamar").select("*, kos!inner(nama_kos, user_id)").eq("kos.user_id", user.id).order("nomor"),
        ]);
        setPenyewaList(penyewaRes.data || []);
        setKamarList(kamarRes.data || []);
        setLoading(false);
    };

    const updateKamarStatus = async (kamarId) => {
        if (!kamarId) return;

        // Count tenants in this room
        const { count, error } = await supabase
            .from("penyewa")
            .select("*", { count: "exact", head: true })
            .eq("kamar_id", kamarId);

        if (error) {
            console.error("Error counting tenants:", error);
            return;
        }

        const newStatus = count === 0 ? "Kosong" : `${count} Orang`;
        await supabase.from("kamar").update({ status: newStatus }).eq("id", kamarId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, jatuh_tempo: parseInt(form.jatuh_tempo) };
        setLoading(true); // temporary loading state

        if (editItem) {
            await supabase.from("penyewa").update(payload).eq("id", editItem.id);
            // If kamar changed, update both old and new kamar status
            if (editItem.kamar_id !== payload.kamar_id) {
                await updateKamarStatus(editItem.kamar_id);
                await updateKamarStatus(payload.kamar_id);
            } else {
                // Just update current kamar status (in case name changed etc, though status relies on count, harmless to re-check)
                await updateKamarStatus(payload.kamar_id);
            }
        } else {
            await supabase.from("penyewa").insert(payload);
            await updateKamarStatus(payload.kamar_id);
        }

        closeModal();
        await fetchData();
    };

    const handleDelete = async (item) => {
        if (!confirm("Yakin ingin menghapus penyewa ini?")) return;
        await supabase.from("penyewa").delete().eq("id", item.id);
        await updateKamarStatus(item.kamar_id);
        fetchData();
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            kamar_id: item.kamar_id,
            nama: item.nama,
            no_hp: item.no_hp || "",
            tanggal_masuk: item.tanggal_masuk || "",
            jatuh_tempo: item.jatuh_tempo || 1,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setForm({ kamar_id: "", nama: "", no_hp: "", tanggal_masuk: "", jatuh_tempo: 1 });
    };

    const columns = [
        { key: "nama", label: "Nama" },
        { key: "no_hp", label: "No HP" },
        {
            key: "kamar",
            label: "Kamar",
            render: (val) => (
                <span className="text-slate-300">
                    {val?.kos?.nama_kos} - {val?.nomor}
                </span>
            ),
        },
        {
            key: "tanggal_masuk",
            label: "Tanggal Masuk",
            render: (val) => val ? new Date(val).toLocaleDateString("id-ID") : "-",
        },
        {
            key: "jatuh_tempo",
            label: "Jatuh Tempo",
            render: (val) => (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium">
                    Tanggal {val}
                </span>
            ),
        },
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Kelola Penyewa</h1>
                    <p className="text-slate-400">Data penyewa di semua properti kos Anda.</p>
                </div>
                <button onClick={() => { setForm({ ...form, kamar_id: kamarList[0]?.id || "" }); setShowModal(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Tambah Penyewa
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : (
                <DataTable columns={columns} data={penyewaList} emptyMessage="Belum ada penyewa." actions={(row) => (
                    <>
                        <button onClick={() => openEdit(row)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(row)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </>
                )} />
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editItem ? "Edit Penyewa" : "Tambah Penyewa"}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Kamar</label>
                        <select value={form.kamar_id} onChange={(e) => setForm({ ...form, kamar_id: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Pilih Kamar</option>
                            {kamarList.map((k) => (
                                <option key={k.id} value={k.id}>
                                    {k.kos?.nama_kos} - Kamar {k.nomor} ({k.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nama Penyewa</label>
                        <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nama lengkap" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">No HP (WhatsApp)</label>
                        <input type="text" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="08xxxxxxxxxx" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal Masuk</label>
                            <input type="date" value={form.tanggal_masuk} onChange={(e) => setForm({ ...form, tanggal_masuk: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Jatuh Tempo (Tanggal)</label>
                            <input type="number" min="1" max="31" value={form.jatuh_tempo} onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors">Batal</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all">{editItem ? "Simpan" : "Tambah"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
