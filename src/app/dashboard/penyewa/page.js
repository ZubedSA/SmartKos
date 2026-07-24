"use client";

import { useState, useEffect } from "react";
import { useKos } from "@/context/KosContext";
import { createClient } from "@/lib/supabase";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function PenyewaPage() {
    const { selectedKosId } = useKos();
    const [penyewaList, setPenyewaList] = useState([]);
    const [kamarList, setKamarList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ kamar_id: "", nama: "", no_hp: "", tanggal_masuk: "", jatuh_tempo: 1 });

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: "danger",
        title: "",
        message: "",
        onConfirm: () => { },
        loading: false
    });

    const supabase = createClient();

    useEffect(() => { fetchData(); }, [selectedKosId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let penyewaQuery = supabase.from("penyewa").select("id, nama, no_hp, tanggal_masuk, jatuh_tempo, kamar_id, created_at, kamar!inner(nomor, harga, kos!inner(id, nama_kos))").order("created_at", { ascending: false });
            let kamarQuery = supabase.from("kamar").select("id, nomor, harga, status, kos_id, kos!inner(id, nama_kos)").order("nomor");

            if (selectedKosId !== "all") {
                penyewaQuery = penyewaQuery.eq("kamar.kos_id", selectedKosId);
                kamarQuery = kamarQuery.eq("kos_id", selectedKosId);
            }

            const [penyewaRes, kamarRes] = await Promise.all([
                penyewaQuery,
                kamarQuery,
            ]);

            if (penyewaRes.error) throw penyewaRes.error;
            if (kamarRes.error) throw kamarRes.error;

            setPenyewaList(penyewaRes.data || []);
            setKamarList(kamarRes.data || []);
        } catch (error) {
            console.error("Error fetching penyewa dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateKamarStatus = async (kamarId) => {
        if (!kamarId) return;
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
        if (e) e.preventDefault();
        const payload = { ...form, jatuh_tempo: parseInt(form.jatuh_tempo) };
        setSubmitLoading(true);

        if (editItem) {
            await supabase.from("penyewa").update(payload).eq("id", editItem.id);
            if (editItem.kamar_id !== payload.kamar_id) {
                await updateKamarStatus(editItem.kamar_id);
                await updateKamarStatus(payload.kamar_id);
            } else {
                await updateKamarStatus(payload.kamar_id);
            }
        } else {
            await supabase.from("penyewa").insert(payload);
            await updateKamarStatus(payload.kamar_id);
        }

        setSubmitLoading(false);
        closeModal();
        await fetchData();
    };

    const handleDelete = (item) => {
        setConfirmModal({
            isOpen: true,
            type: "danger",
            title: "Hapus Penyewa",
            message: `Apakah Anda yakin ingin menghapus penyewa "${item.nama}"? Data tagihan dan riwayat pembayaran terkait mungkin akan terpengaruh.`,
            confirmText: "Hapus Penyewa",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, loading: true }));
                await supabase.from("penyewa").delete().eq("id", item.id);
                await updateKamarStatus(item.kamar_id);
                await fetchData();
                setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            }
        });
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
            label: "Masuk",
            render: (val) => val ? new Date(val).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-",
        },
        {
            key: "jatuh_tempo",
            label: "Jatuh Tempo",
            render: (val) => (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/10">
                    Tgl {val}
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
                <button
                    onClick={() => { setForm({ ...form, kamar_id: kamarList[0]?.id || "" }); setShowModal(true); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
                >
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
                    <div className="flex gap-2">
                        <button onClick={() => openEdit(row)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(row)} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )} />
            )}

            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editItem ? "Edit Penyewa" : "Tambah Penyewa"}
                footer={(
                    <>
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors">
                            Batal
                        </button>
                        <button onClick={handleSubmit} disabled={submitLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2">
                            {submitLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            {editItem ? "Simpan Perubahan" : "Tambah Penyewa"}
                        </button>
                    </>
                )}
            >
                <form className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Kamar</label>
                        <select value={form.kamar_id} onChange={(e) => setForm({ ...form, kamar_id: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
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
                        <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nama lengkap" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">No HP (WhatsApp)</label>
                        <input type="text" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Contoh: 081234567890" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal Masuk</label>
                            <input type="date" value={form.tanggal_masuk} onChange={(e) => setForm({ ...form, tanggal_masuk: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Jatuh Tempo (Tgl)</label>
                            <input type="number" min="1" max="31" value={form.jatuh_tempo} onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
