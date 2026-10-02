"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterRole, setFilterRole] = useState("all");

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showExpiryModal, setShowExpiryModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // Selected user for editing/actions
    const [selectedUser, setSelectedUser] = useState(null);

    // Form Data States
    const [createForm, setCreateForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "owner",
        subscription_status: "active",
        subscription_days: 30,
    });

    const [editForm, setEditForm] = useState({
        id: "",
        name: "",
        email: "",
        role: "owner",
        subscription_status: "active",
        subscription_expired_at: "",
        is_approved: true,
    });

    const [expiryDate, setExpiryDate] = useState("");
    const [resetPassword, setResetPassword] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState({ text: "", type: "" });

    // Confirmation Modal State
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
        setTimeout(() => {
            setToastMessage({ text: "", type: "" });
        }, 4000);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // READ: Fetch all users from Admin API
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat daftar user");
            setUsers(data.users || []);
        } catch (err) {
            console.error("Error fetching users:", err);
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // CREATE: Add new user via Admin API
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal membuat user");

            showToast(`User ${createForm.name} berhasil ditambahkan!`, "success");
            setShowCreateModal(false);
            setCreateForm({
                name: "",
                email: "",
                password: "",
                role: "owner",
                subscription_status: "active",
                subscription_days: 30,
            });
            await fetchUsers();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    // UPDATE: Open Edit Modal
    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditForm({
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            role: user.role || "owner",
            subscription_status: user.subscription_status || "active",
            subscription_expired_at: user.subscription_expired_at || "",
            is_approved: user.is_approved !== false,
        });
        setShowEditModal(true);
    };

    // UPDATE: Submit User Edit
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memperbarui user");

            showToast(`Data user ${editForm.name} berhasil disimpan!`, "success");
            setShowEditModal(false);
            setSelectedUser(null);
            await fetchUsers();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    // UPDATE: Quick Toggle Status
    const toggleStatus = (user) => {
        const isActive = user.subscription_status === "active";
        const newStatus = isActive ? "inactive" : "active";

        setConfirmModal({
            isOpen: true,
            type: isActive ? "warning" : "success",
            title: isActive ? "Nonaktifkan Akun" : "Aktifkan Akun",
            message: `Apakah Anda yakin ingin ${isActive ? 'menonaktifkan' : 'mengaktifkan'} akun "${user.name}"?`,
            confirmText: isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan",
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, loading: true }));
                try {
                    const res = await fetch("/api/admin/users", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: user.id,
                            subscription_status: newStatus,
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Gagal mengubah status");

                    showToast(`Status ${user.name} berhasil diubah menjadi ${newStatus}!`, "success");
                    await fetchUsers();
                } catch (err) {
                    showToast(err.message, "error");
                } finally {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
                }
            },
        });
    };

    // UPDATE: Set Expiry Date
    const openExpiryModal = (user) => {
        setSelectedUser(user);
        setExpiryDate(user.subscription_expired_at || "");
        setShowExpiryModal(true);
    };

    const handleSetExpiry = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        setActionLoading(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedUser.id,
                    subscription_expired_at: expiryDate,
                    subscription_status: "active",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal mengatur masa aktif");

            showToast(`Masa aktif untuk ${selectedUser.name} berhasil diperbarui!`, "success");
            setShowExpiryModal(false);
            setSelectedUser(null);
            await fetchUsers();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const addDaysToExpiry = (days) => {
        const base = expiryDate ? new Date(expiryDate) : new Date();
        base.setDate(base.getDate() + days);
        setExpiryDate(base.toISOString().split("T")[0]);
    };

    // RESET PASSWORD
    const openResetModal = (user) => {
        setSelectedUser(user);
        setResetPassword("");
        setShowResetModal(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!selectedUser || !resetPassword) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    newPassword: resetPassword,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal mereset password");

            showToast(`Password untuk ${selectedUser.name} berhasil direset!`, "success");
            setShowResetModal(false);
            setSelectedUser(null);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    // DELETE: Delete user permanently
    const handleDeleteUser = (user) => {
        setConfirmModal({
            isOpen: true,
            type: "danger",
            title: "Hapus Akun User Permanen",
            message: `Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.email})? Tindakan ini bersifat PERMANEN dan menghapus akun auth beserta seluruh data properti terkait.`,
            confirmText: "Hapus Permanen",
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, loading: true }));
                try {
                    const res = await fetch(`/api/admin/users?id=${user.id}`, {
                        method: "DELETE",
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Gagal menghapus user");

                    showToast(`Akun ${user.name} berhasil dihapus permanen.`, "success");
                    await fetchUsers();
                } catch (err) {
                    showToast("Gagal menghapus user: " + err.message, "error");
                } finally {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
                }
            },
        });
    };

    // FILTER LOGIC
    const filteredUsers = users.filter((u) => {
        if (filterRole !== "all" && u.role !== filterRole) return false;

        if (filterStatus === "active" && u.subscription_status !== "active") return false;
        if (filterStatus === "inactive" && u.subscription_status !== "inactive") return false;
        if (filterStatus === "pending" && u.is_approved !== false) return false;

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    const columns = [
        {
            key: "name",
            label: "Nama & Email",
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                        row.role === "admin"
                            ? "bg-gradient-to-tr from-purple-600 to-pink-500"
                            : "bg-gradient-to-tr from-indigo-500 to-cyan-500"
                    }`}>
                        {val?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-white hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => openEditModal(row)}>
                                {val}
                            </p>
                            {row.role === "admin" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    ADMIN
                                </span>
                            )}
                            {row.is_approved === false && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    PENDING
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "subscription_status",
            label: "Status",
            render: (val) => (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                    val === "active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${val === "active" ? "bg-emerald-400" : "bg-red-400"}`}></span>
                    {val === "active" ? "Aktif" : "Nonaktif"}
                </span>
            ),
        },
        {
            key: "subscription_expired_at",
            label: "Masa Aktif",
            render: (val, row) => {
                if (row.role === "admin") {
                    return <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Unlimited</span>;
                }
                if (!val) return <span className="text-slate-500">-</span>;
                const isExpired = new Date(val) < new Date();
                return (
                    <div className="flex flex-col">
                        <span className={`text-xs font-medium ${isExpired ? "text-red-400 font-bold" : "text-slate-300"}`}>
                            {new Date(val).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        {isExpired && <span className="text-[10px] text-red-400">Kadaluarsa</span>}
                    </div>
                );
            },
        },
        {
            key: "created_at",
            label: "Terdaftar",
            render: (val) => (
                <span className="text-xs text-slate-400">
                    {val ? new Date(val).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage.text && (
                <div className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-xl transition-all ${
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1e293b]/70 border border-[#334155] p-5 sm:p-6 rounded-2xl">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        Kelola Users & Owner
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {filteredUsers.length}
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Sistem CRUD lengkap untuk mengelola akun owner, masa aktif subscription, reset password, dan hak akses.
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah User Baru
                </button>
            </div>

            {/* Search & Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Bar */}
                <div className="sm:col-span-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e293b] border border-[#334155] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1e293b] border border-[#334155] text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        <option value="all">Semua Status Langganan</option>
                        <option value="active">Status: Aktif</option>
                        <option value="inactive">Status: Nonaktif</option>
                        <option value="pending">Status: Menunggu Approval</option>
                    </select>
                </div>

                {/* Role Filter */}
                <div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1e293b] border border-[#334155] text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        <option value="all">Semua Role</option>
                        <option value="owner">Role: Owner Kos</option>
                        <option value="admin">Role: Administrator</option>
                    </select>
                </div>
            </div>

            {/* Mobile Native Card View (visible on small screens) */}
            <div className="block lg:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 bg-[#1e293b]/50 border border-[#334155] rounded-2xl text-slate-400 text-sm">
                        Tidak ada data user yang cocok dengan filter.
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4 shadow-md space-y-3 hover:border-slate-600 transition-all"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                                        user.role === "admin"
                                            ? "bg-gradient-to-tr from-purple-600 to-pink-500"
                                            : "bg-gradient-to-tr from-indigo-500 to-cyan-500"
                                    }`}>
                                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <h3 className="font-semibold text-white text-sm">{user.name}</h3>
                                            {user.role === "admin" && (
                                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-bold">ADMIN</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400">{user.email}</p>
                                    </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    user.subscription_status === "active"
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}>
                                    {user.subscription_status === "active" ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>

                            {/* Card Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-[#0f172a]/60 p-2.5 rounded-xl border border-slate-800">
                                <div>
                                    <span className="text-slate-500 block text-[10px]">Masa Aktif</span>
                                    <span className="text-slate-300 font-medium">
                                        {user.role === "admin" ? "Selamanya" : user.subscription_expired_at ? new Date(user.subscription_expired_at).toLocaleDateString("id-ID") : "-"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">Terdaftar</span>
                                    <span className="text-slate-300 font-medium">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-"}
                                    </span>
                                </div>
                            </div>

                            {/* Mobile Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#334155]/60">
                                <button
                                    onClick={() => openEditModal(user)}
                                    className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>

                                <button
                                    onClick={() => toggleStatus(user)}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-colors ${
                                        user.subscription_status === "active"
                                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                            : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                    }`}
                                >
                                    {user.subscription_status === "active" ? "Nonaktifkan" : "Aktifkan"}
                                </button>

                                <button
                                    onClick={() => openResetModal(user)}
                                    className="p-2 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs"
                                    title="Reset Password"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                                    title="Hapus User"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View (visible on large screens) */}
            <div className="hidden lg:block">
                {loading ? (
                    <div className="flex justify-center py-20 bg-[#1e293b] rounded-2xl border border-[#334155]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredUsers}
                        emptyMessage="Belum ada user yang terdaftar sesuai filter."
                        actions={(row) => (
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => openEditModal(row)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={() => toggleStatus(row)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        row.subscription_status === "active"
                                            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                    }`}
                                >
                                    {row.subscription_status === "active" ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                                <button
                                    onClick={() => openExpiryModal(row)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                                >
                                    Masa Aktif
                                </button>
                                <button
                                    onClick={() => openResetModal(row)}
                                    className="p-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                                    title="Reset Password"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(row)}
                                    className="p-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
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
            </div>

            {/* CREATE USER MODAL */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Tambah User / Owner Baru"
                size="md"
                footer={(
                    <>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleCreateUser}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                            Simpan & Buat Akun
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Nama Lengkap</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Budi Santoso"
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            placeholder="nama@email.com"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Minimal 6 karakter"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Role User</label>
                            <select
                                value={createForm.role}
                                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="owner">Owner Kos</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Durasi Langganan (Hari)</label>
                            <input
                                type="number"
                                min={1}
                                value={createForm.subscription_days}
                                onChange={(e) => setCreateForm({ ...createForm, subscription_days: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* EDIT USER MODAL */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Data User & Hak Akses"
                size="md"
                footer={(
                    <>
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleUpdateUser}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                            Simpan Perubahan
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Nama Lengkap</label>
                        <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Role</label>
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="owner">Owner Kos</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Status Langganan</label>
                            <select
                                value={editForm.subscription_status}
                                onChange={(e) => setEditForm({ ...editForm, subscription_status: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal Berakhir Langganan</label>
                        <input
                            type="date"
                            value={editForm.subscription_expired_at}
                            onChange={(e) => setEditForm({ ...editForm, subscription_expired_at: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </form>
            </Modal>

            {/* SET EXPIRY MODAL */}
            <Modal
                isOpen={showExpiryModal}
                onClose={() => setShowExpiryModal(false)}
                title="Atur Masa Aktif Langganan"
                size="sm"
                footer={(
                    <>
                        <button
                            type="button"
                            onClick={() => setShowExpiryModal(false)}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSetExpiry}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {actionLoading ? "Menyimpan..." : "Simpan"}
                        </button>
                    </>
                )}
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                        Atur tanggal berakhir subscription untuk user: <b className="text-white">{selectedUser?.name}</b>
                    </p>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal Berakhir</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => addDaysToExpiry(30)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                        >
                            +30 Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => addDaysToExpiry(90)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                        >
                            +90 Hari (3 Bulan)
                        </button>
                        <button
                            type="button"
                            onClick={() => addDaysToExpiry(365)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                        >
                            +1 Tahun
                        </button>
                    </div>
                </div>
            </Modal>

            {/* RESET PASSWORD MODAL */}
            <Modal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                title="Reset Password User"
                size="sm"
                footer={(
                    <>
                        <button
                            type="button"
                            onClick={() => setShowResetModal(false)}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleResetPassword}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                            Reset Password Sekarang
                        </button>
                    </>
                )}
            >
                <div className="space-y-4">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 text-xs text-purple-300">
                        Password untuk akun <b className="text-white">{selectedUser?.name}</b> ({selectedUser?.email}) akan diganti secara langsung.
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Password Baru</label>
                        <input
                            type="text"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </Modal>

            {/* CONFIRMATION MODAL */}
            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
