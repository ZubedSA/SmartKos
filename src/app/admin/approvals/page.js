"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function AdminApprovalsPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState({ text: "", type: "" });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: "info",
        title: "",
        message: "",
        confirmText: "Konfirmasi",
        onConfirm: () => { },
        loading: false,
    });

    const showToast = (text, type = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage({ text: "", type: "" }), 4000);
    };

    useEffect(() => {
        fetchUnapprovedUsers();
    }, []);

    const fetchUnapprovedUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/approvals");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat persetujuan");
            setUsers(data.users || []);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (user) => {
        setConfirmModal({
            isOpen: true,
            type: "success",
            title: "Setujui Pendaftaran User",
            message: `Apakah Anda yakin ingin menyetujui pendaftaran "${user.name}" (${user.email})? User ini akan langsung dapat login ke dashboard owner.`,
            confirmText: "Setujui Sekarang",
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, loading: true }));
                try {
                    const res = await fetch("/api/admin/approvals", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: user.id, action: "approve" }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Gagal menyetujui user");

                    showToast(`Pendaftaran ${user.name} berhasil disetujui!`, "success");
                    await fetchUnapprovedUsers();
                } catch (err) {
                    showToast(err.message, "error");
                } finally {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
                }
            },
        });
    };

    const handleReject = (user) => {
        setConfirmModal({
            isOpen: true,
            type: "danger",
            title: "Tolak & Hapus Pendaftaran",
            message: `Apakah Anda yakin ingin menolak pendaftaran "${user.name}"? Akun dan data profil user ini akan dihapus secara permanen.`,
            confirmText: "Tolak & Hapus",
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, loading: true }));
                try {
                    const res = await fetch("/api/admin/approvals", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: user.id, action: "reject" }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Gagal menolak user");

                    showToast(`Pendaftaran ${user.name} telah ditolak dan dihapus.`, "success");
                    await fetchUnapprovedUsers();
                } catch (err) {
                    showToast(err.message, "error");
                } finally {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
                }
            },
        });
    };

    const columns = [
        {
            key: "name",
            label: "Nama & Email",
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
                        {val?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <p className="font-semibold text-white">{val}</p>
                        <p className="text-xs text-slate-400">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "subscription_status",
            label: "Jenis Pengajuan",
            render: (val) => (
                val === "pending_renewal" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        🔄 Perpanjangan
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        🆕 Akun Baru
                    </span>
                )
            ),
        },
        {
            key: "created_at",
            label: "Tanggal Waktu",
            render: (val) => (
                <span className="text-xs text-slate-300">
                    {val
                        ? new Date(val).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "-"}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage.text && (
                <div className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-xl ${
                    toastMessage.type === "success"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-red-500/20 text-red-300 border border-red-500/40"
                }`}>
                    <div className="flex items-center gap-2">
                        <span>{toastMessage.type === "success" ? "✓" : "⚠️"}</span>
                        <span>{toastMessage.text}</span>
                    </div>
                    <button onClick={() => setToastMessage({ text: "", type: "" })} className="text-slate-400 hover:text-white">✕</button>
                </div>
            )}

            {/* Page Header */}
            <div className="bg-[#1e293b]/70 border border-[#334155] p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        Persetujuan Pendaftaran
                        {users.length > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                {users.length} Menunggu
                            </span>
                        )}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Tinjau dan berikan persetujuan bagi calon owner kos sebelum mereka dapat mengakses dashboard aplikasi.
                    </p>
                </div>

                <button
                    onClick={fetchUnapprovedUsers}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
                >
                    <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                </button>
            </div>

            {/* Mobile Native Card View */}
            <div className="block lg:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 bg-[#1e293b]/50 border border-[#334155] rounded-2xl text-slate-400 text-sm">
                        🎉 Tidak ada pendaftaran baru yang menunggu persetujuan.
                    </div>
                ) : (
                    users.map((user) => (
                        <div
                            key={user.id}
                            className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4 shadow-md space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-base text-white shrink-0">
                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-semibold text-white text-sm truncate">{user.name}</h3>
                                        {user.subscription_status === "pending_renewal" ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                                🔄 Perpanjangan
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                                                🆕 Akun Baru
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">
                                        Tanggal: {new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-[#334155]">
                                <button
                                    onClick={() => handleApprove(user)}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Setujui
                                </button>
                                <button
                                    onClick={() => handleReject(user)}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 border border-red-500/30 active:scale-95 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Tolak
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
                {loading ? (
                    <div className="flex justify-center py-20 bg-[#1e293b] rounded-2xl border border-[#334155]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={users}
                        emptyMessage="Tidak ada pendaftaran baru yang menunggu persetujuan."
                        actions={(row) => (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleApprove(row)}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Setujui
                                </button>
                                <button
                                    onClick={() => handleReject(row)}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Tolak & Hapus
                                </button>
                            </div>
                        )}
                    />
                )}
            </div>

            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
