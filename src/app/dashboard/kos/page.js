"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createClient } from "@/lib/supabase";

export default function KosPage() {
    const [kosList, setKosList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nama_kos: "", alamat: "" });
    const [submitLoading, setSubmitLoading] = useState(false);

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

    useEffect(() => {
        fetchKos();
    }, []);

    const fetchKos = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("kos")
            .select("*, kamar(count)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        setKosList(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setSubmitLoading(true);
        if (editItem) {
            await supabase.from("kos").update(form).eq("id", editItem.id);
        } else {
            await supabase.from("kos").insert({ ...form, user_id: user.id });
        }
        setSubmitLoading(false);
        closeModal();
        fetchKos();
    };

    const handleDelete = (item) => {
        setConfirmModal({
            isOpen: true,
            type: "danger",
            title: "Hapus Kos",
            message: `Apakah Anda yakin ingin menghapus kos "${item.nama_kos}"? Semua data kamar dan penyewa di dalamnya juga akan terhapus secara permanen.`,
            confirmText: "Hapus Kos",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, loading: true }));
                await supabase.from("kos").delete().eq("id", item.id);
                await fetchKos();
                setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            }
        });
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({ nama_kos: item.nama_kos, alamat: item.alamat || "" });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setForm({ nama_kos: "", alamat: "" });
    };

    const columns = [
        { key: "nama_kos", label: "Nama Kos" },
        { key: "alamat", label: "Alamat" },
        {
            key: "kamar",
            label: "Jumlah Kamar",
            render: (val) => (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-medium border border-indigo-500/10">
                    {val?.[0]?.count || 0} kamar
                </span>
            ),
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Kelola Kos</h1>
                    <p className="text-slate-400">Tambah dan kelola properti kos Anda.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Kos
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
                <DataTable
                    columns={columns}
                    data={kosList}
                    emptyMessage="Belum ada kos. Klik tombol Tambah Kos untuk mulai."
                    actions={(row) => (
                        <div className="flex gap-2">
                            <button onClick={() => openEdit(row)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button onClick={() => handleDelete(row)} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                />
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editItem ? "Edit Kos" : "Tambah Kos"}
                footer={(
                    <>
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors">
                            Batal
                        </button>
                        <button onClick={handleSubmit} disabled={submitLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2">
                            {submitLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            {editItem ? "Simpan Perubahan" : "Tambah Kos"}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nama Kos</label>
                        <input
                            type="text"
                            value={form.nama_kos}
                            onChange={(e) => setForm({ ...form, nama_kos: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Contoh: Kos Abadi Jaya"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Alamat</label>
                        <textarea
                            value={form.alamat}
                            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                            placeholder="Alamat lengkap properti"
                        />
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
