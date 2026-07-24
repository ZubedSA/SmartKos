"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createClient } from "@/lib/supabase";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [expiryDate, setExpiryDate] = useState("");

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: "info",
        title: "",
        message: "",
        onConfirm: () => { },
        loading: false
    });

    // Reset Password State
    const [resetPassword, setResetPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("users")
            .select("*")
            .eq("role", "owner")
            .order("created_at", { ascending: false });
        setUsers(data || []);
        setLoading(false);
    };

    const toggleStatus = (user) => {
        const isActive = user.subscription_status === "active";
        setConfirmModal({
            isOpen: true,
            type: isActive ? "warning" : "success",
            title: isActive ? "Nonaktifkan Akun" : "Aktifkan Akun",
            message: `Apakah Anda yakin ingin ${isActive ? 'menonaktifkan' : 'mengaktifkan'} akun ${user.name}?`,
            confirmText: isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, loading: true }));
                const newStatus = isActive ? "inactive" : "active";
                await supabase.from("users").update({ subscription_status: newStatus }).eq("id", user.id);
                await fetchUsers();
                setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            }
        });
    };

    const openExpiryModal = (user) => {
        setSelectedUser(user);
        setExpiryDate(user.subscription_expired_at || "");
        setShowModal(true);
    };

    const handleSetExpiry = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        await supabase.from("users").update({
            subscription_expired_at: expiryDate,
            subscription_status: "active",
        }).eq("id", selectedUser.id);
        setShowModal(false);
        setSelectedUser(null);
        fetchUsers();
    };

    // Reset Password Handlers
    const openResetModal = (user) => {
        setSelectedUser(user);
        setResetPassword("");
        setShowResetModal(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!selectedUser || !resetPassword) return;

        setResetLoading(true);
        try {
            const res = await fetch("/api/admin/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUser.id, newPassword: resetPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Gagal mereset password");
            }

            alert(`Password untuk ${selectedUser.name} berhasil direset!`);
            setShowResetModal(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setResetLoading(false);
        }
    };

    const columns = [
        {
            key: "name",
            label: "Nama",
            render: (val, row) => (
                <div
                    onDoubleClick={() => openResetModal(row)}
                    className="cursor-pointer hover:text-indigo-400 transition-colors select-none"
                    title="Double click untuk reset password"
                >
                    <p className="font-medium text-white">{val}</p>
                    <p className="text-xs text-slate-400">{row.email}</p>
                </div>
            ),
        },
        {
            key: "subscription_status",
            label: "Status",
            render: (val) => (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${val === "active"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                    }`}>
                    {val === "active" ? "Aktif" : "Nonaktif"}
                </span>
            ),
        },
        {
            key: "subscription_expired_at",
            label: "Berakhir",
            render: (val) => val ? (
                <span className={`text-sm ${new Date(val) < new Date() ? "text-red-400" : "text-slate-300"}`}>
                    {new Date(val).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                </span>
            ) : (
                <span className="text-slate-500">-</span>
            ),
        },
        {
            key: "created_at",
            label: "Terdaftar",
            render: (val) => (
                <span className="text-sm text-slate-400">
                    {new Date(val).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                </span>
            ),
        },
    ];

    const [searchQuery, setSearchQuery] = useState("");

    const handleDeleteUser = (user) => {
        setConfirmModal({
            isOpen: true,
            type: "danger",
            title: "Hapus Akun User Permanen",
            message: `Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.email})? Tindakan ini bersifat PERMANEN dan akan menghapus seluruh data user dan properti miliknya.`,
            confirmText: "Hapus Permanen",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, loading: true }));
                try {
                    const { error } = await supabase.from("users").delete().eq("id", user.id);
                    if (error) throw error;
                    alert(`Akun ${user.name} berhasil dihapus.`);
                    await fetchUsers();
                } catch (err) {
                    alert("Gagal menghapus user: " + err.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
                }
            }
        });
    };

    const filteredUsers = users.filter(u => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Kelola Users</h1>
                    <p className="text-slate-400">Kelola akun owner, masa aktif subscription, dan hapus user.</p>
                    <p className="text-xs text-indigo-400 mt-2">* Double click nama user untuk reset password</p>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e293b] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                </div>
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
                    data={filteredUsers}
                    emptyMessage="Belum ada user terdaftar."
                    actions={(row) => (
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => toggleStatus(row)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${row.subscription_status === "active"
                                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                    }`}
                            >
                                {row.subscription_status === "active" ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button
                                onClick={() => openExpiryModal(row)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                            >
                                Set Masa Aktif
                            </button>
                            <button
                                onClick={() => handleDeleteUser(row)}
                                className="p-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                title="Hapus Akun Permanen"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                />
            )}

            {/* Expiry Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Set Masa Aktif Subscription"
                size="sm"
                footer={(
                    <>
                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors">
                            Batal
                        </button>
                        <button onClick={handleSetExpiry} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all">
                            Simpan
                        </button>
                    </>
                )}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Set tanggal berakhir subscription untuk <span className="text-white font-medium">{selectedUser?.name}</span>
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal Berakhir</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </div>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                title="Reset Password User"
                size="sm"
                footer={(
                    <>
                        <button type="button" onClick={() => setShowResetModal(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors">
                            Batal
                        </button>
                        <button
                            onClick={handleResetPassword}
                            disabled={resetLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-medium hover:from-red-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {resetLoading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            Reset Password
                        </button>
                    </>
                )}
            >
                <div className="space-y-5">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-sm text-amber-400">
                            Warning: Password user <b>{selectedUser?.name}</b> akan diganti secara paksa.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password Baru</label>
                        <input
                            type="text"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
