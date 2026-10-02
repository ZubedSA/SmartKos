"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

export default function AdminAkunPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({ name: "" });
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();
                setUser(profile || { email: authUser.email, name: "Admin" });
                setFormData({ name: profile?.name || "" });
            }
        } catch (err) {
            console.error("Error fetching admin profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    name: formData.name,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil");

            setUser((prev) => ({ ...prev, name: formData.name }));
            setMessage({ text: "Profil berhasil diperbarui!", type: "success" });
            setShowEditModal(false);
        } catch (err) {
            setMessage({ text: err.message, type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: "Konfirmasi password baru tidak cocok", type: "error" });
            return;
        }

        setActionLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const res = await fetch("/api/admin/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal mengubah password");

            setMessage({ text: "Password berhasil diubah!", type: "success" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPasswordModal(false);
        } catch (err) {
            setMessage({ text: err.message, type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto pb-12">
            {/* Header / Toast Message */}
            {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between ${
                    message.type === "success"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: "", type: "" })} className="opacity-70 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Profile Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl border border-white/10 mb-6">
                <div className="absolute top-3 right-3 bg-indigo-900/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-indigo-400/30">
                    🛡️ Super Admin
                </div>

                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl sm:text-4xl font-bold mx-auto mb-4 border-4 border-white/20 shadow-inner">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user?.name || "Admin SmartKos"}</h1>
                <p className="text-indigo-200 text-sm mt-0.5">{user?.email}</p>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Akses Administrator Penuh
                </div>
            </div>

            {/* Menu Options */}
            <div className="space-y-4">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/80 divide-y divide-slate-700/60 overflow-hidden shadow-lg">
                    {/* Edit Profil */}
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
                    >
                        <div className="flex items-center gap-3.5 text-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-sm sm:text-base text-white block">Ubah Nama Profil</span>
                                <span className="text-xs text-slate-400">Ubah nama tampilan administrator</span>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Ganti Password */}
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
                    >
                        <div className="flex items-center gap-3.5 text-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-sm sm:text-base text-white block">Ganti Password</span>
                                <span className="text-xs text-slate-400">Perbarui kata sandi login admin</span>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-red-500/10 active:bg-red-500/20 transition-colors group"
                    >
                        <div className="flex items-center gap-3.5 text-red-400 group-hover:text-red-300">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-sm sm:text-base block">Keluar Aplikasi</span>
                                <span className="text-xs text-red-400/80">Logout dari sesi admin panel</span>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* System Info Info Box */}
                <div className="p-4 rounded-2xl bg-[#1e293b]/50 border border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                    <span>Versi Platform: <b className="text-slate-300">SmartKos v2.0 (Mobile Native)</b></span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Sistem Online
                    </span>
                </div>
            </div>

            {/* Edit Name Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Ubah Nama Profil Admin"
                size="sm"
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
                            onClick={handleUpdateProfile}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nama Lengkap</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Nama Admin"
                        />
                    </div>
                </form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Ganti Password Admin"
                size="sm"
                footer={(
                    <>
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(false)}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-[#334155] hover:bg-[#334155] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleChangePassword}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50"
                        >
                            {actionLoading ? "Memproses..." : "Update Password"}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password Baru</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                            minLength={6}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                            minLength={6}
                            placeholder="Ulangi password baru"
                            className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
