"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";

export default function AkunPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modal states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Form states
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [profileData, setProfileData] = useState({ name: "" });

    // Notification / Alert state
    const [message, setMessage] = useState({ text: "", type: "" });
    const [modalError, setModalError] = useState("");

    const supabase = createClient();
    const router = useRouter();

    const fetchUserProfile = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();

                const userData = profile || {
                    id: authUser.id,
                    email: authUser.email,
                    name: authUser.user_metadata?.name || "Pengguna SmartKos",
                    role: "owner"
                };

                setUser(userData);
                setProfileData({ name: userData?.name || "" });
            }
        } catch (err) {
            console.error("Gagal memuat data profil:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();

        // Check if query params specify an action (e.g. ?action=password from kelola hub)
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const action = params.get("action");
            if (action === "password") {
                setShowPasswordModal(true);
            } else if (action === "edit") {
                setShowEditProfileModal(true);
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
        } catch (err) {
            console.error("Gagal logout:", err);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setModalError("");

        // Validasi input
        if (!passwordData.currentPassword) {
            setModalError("Masukkan password saat ini (lama).");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setModalError("Password baru minimal 6 karakter.");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setModalError("Konfirmasi password baru tidak cocok.");
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            setModalError("Password baru tidak boleh sama dengan password saat ini.");
            return;
        }

        setActionLoading(true);

        try {
            // 1. Verifikasi kecocokan password lama dengan re-autentikasi
            if (user?.email) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: passwordData.currentPassword,
                });

                if (signInError) {
                    throw new Error("Password saat ini salah. Pastikan password lama Anda benar.");
                }
            }

            // 2. Lakukan update ke password baru di Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (updateError) {
                let friendlyMessage = updateError.message;
                if (friendlyMessage.includes("Password should be at least")) {
                    friendlyMessage = "Password minimal 6 karakter.";
                } else if (friendlyMessage.includes("different from the old")) {
                    friendlyMessage = "Password baru tidak boleh sama dengan password lama.";
                }
                throw new Error(friendlyMessage);
            }

            // Sukses
            setMessage({
                text: "Password berhasil diperbarui! Gunakan password baru Anda pada login berikutnya.",
                type: "success"
            });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPasswordModal(false);
        } catch (err) {
            setModalError(err.message || "Gagal mengubah password.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setModalError("");

        const trimmedName = profileData.name.trim();
        if (!trimmedName) {
            setModalError("Nama lengkap tidak boleh kosong.");
            return;
        }

        setActionLoading(true);

        try {
            // 1. Update ke table users
            const { error: dbError } = await supabase
                .from("users")
                .update({ name: trimmedName })
                .eq("id", user.id);

            if (dbError) throw dbError;

            // 2. Update metadata auth
            await supabase.auth.updateUser({
                data: { name: trimmedName }
            });

            setUser((prev) => ({ ...prev, name: trimmedName }));
            setMessage({
                text: "Profil Anda berhasil diperbarui!",
                type: "success"
            });
            setShowEditProfileModal(false);
        } catch (err) {
            setModalError(err.message || "Gagal memperbarui profil.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm">Memuat informasi profil...</p>
            </div>
        );
    }

    const isSubscribed = user?.subscription_status === "active";
    const expiredDateStr = user?.subscription_expired_at
        ? new Date(user.subscription_expired_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
        : "-";

    return (
        <div className="max-w-xl mx-auto pb-24 px-4 sm:px-0">
            {/* Notification Alert Banner */}
            {message.text && (
                <div
                    className={`mb-6 p-4 rounded-2xl flex items-start justify-between gap-3 animate-fade-in ${
                        message.type === "success"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {message.type === "success" ? (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                    <button
                        onClick={() => setMessage({ text: "", type: "" })}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Header Profil Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-center text-white mb-6 shadow-xl shadow-indigo-950/40 border border-indigo-400/20">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl font-extrabold text-white border-4 border-white/30 shadow-inner">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 border-2 border-[#1e293b] rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        {user?.name || "Pengguna SmartKos"}
                    </h1>
                    <p className="text-indigo-200 text-sm font-medium mb-4">{user?.email}</p>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-semibold uppercase tracking-wider">{user?.role || "Owner"} SmartKos</span>
                    </div>
                </div>
            </div>

            {/* Status Langganan & Info Singkat */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Status Langganan</p>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSubscribed ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                        <span className="text-sm font-semibold text-white">
                            {isSubscribed ? "Aktif" : "Nonaktif"}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">s/d {expiredDateStr}</p>
                </div>

                <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Status Keamanan</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-sm font-semibold text-emerald-400">Terlindungi</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Email & Sandi Terverifikasi</p>
                </div>
            </div>

            {/* Menu Navigasi & Pengaturan Akun */}
            <div className="space-y-4">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 divide-y divide-slate-700/50 overflow-hidden shadow-lg">
                    {/* Tombol Edit Profil */}
                    <button
                        onClick={() => {
                            setModalError("");
                            setProfileData({ name: user?.name || "" });
                            setShowEditProfileModal(true);
                        }}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/80 active:bg-slate-800 transition-colors group"
                    >
                        <div className="flex items-center gap-4 text-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-200 block text-sm sm:text-base">Edit Profil</span>
                                <span className="text-xs text-slate-400">Ubah nama dan informasi akun</span>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Tombol Ganti Password */}
                    <button
                        onClick={() => {
                            setModalError("");
                            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                            setShowPasswordModal(true);
                        }}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/80 active:bg-slate-800 transition-colors group"
                    >
                        <div className="flex items-center gap-4 text-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-200 block text-sm sm:text-base">Ganti Password</span>
                                <span className="text-xs text-slate-400">Perbarui kata sandi akun SmartKos</span>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Tombol Keamanan & Sistem */}
                    <Link
                        href="/dashboard/keamanan"
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/80 active:bg-slate-800 transition-colors group"
                    >
                        <div className="flex items-center gap-4 text-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-200 block text-sm sm:text-base">Sistem & Keamanan</span>
                                <span className="text-xs text-slate-400">Log aktivitas sesi & keamanan 2FA</span>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    {/* Tombol Keluar */}
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors group text-rose-400"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold block text-sm sm:text-base">Keluar Aplikasi</span>
                                <span className="text-xs text-rose-400/70">Akhiri sesi di perangkat ini</span>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-rose-400/60 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <p className="text-center text-slate-500 text-xs mt-8">SmartKos App &bull; Versi 1.0.0</p>

            {/* ================= MODAL GANTI PASSWORD ================= */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => {
                    if (!actionLoading) {
                        setShowPasswordModal(false);
                        setModalError("");
                    }
                }}
                title="Ganti Password"
                size="sm"
                footer={(
                    <div className="flex items-center justify-end gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => {
                                setShowPasswordModal(false);
                                setModalError("");
                            }}
                            disabled={actionLoading}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleChangePassword}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2"
                        >
                            {actionLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                "Simpan Password Baru"
                            )}
                        </button>
                    </div>
                )}
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    {modalError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{modalError}</span>
                        </div>
                    )}

                    {/* Password Saat Ini */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Password Saat Ini (Lama)
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                                placeholder="Ketik password lama Anda"
                                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#0f172a] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPasswords.current ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Password Baru */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Password Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Minimal 6 karakter"
                                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#0f172a] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPasswords.new ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Konfirmasi Password Baru */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Konfirmasi Password Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Ulangi password baru"
                                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#0f172a] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPasswords.confirm ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ================= MODAL EDIT PROFIL ================= */}
            <Modal
                isOpen={showEditProfileModal}
                onClose={() => {
                    if (!actionLoading) {
                        setShowEditProfileModal(false);
                        setModalError("");
                    }
                }}
                title="Edit Profil"
                size="sm"
                footer={(
                    <div className="flex items-center justify-end gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditProfileModal(false);
                                setModalError("");
                            }}
                            disabled={actionLoading}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateProfile}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2"
                        >
                            {actionLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </button>
                    </div>
                )}
            >
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {modalError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{modalError}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            required
                            placeholder="Contoh: Budi Santoso"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Email Terdaftar
                        </label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 text-sm cursor-not-allowed select-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Email adalah identitas login utama akun Anda dan tidak dapat diubah sembarangan.
                        </p>
                    </div>
                </form>
            </Modal>

            {/* ================= MODAL KONFIRMASI LOGOUT ================= */}
            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="Konfirmasi Keluar"
                size="sm"
                footer={(
                    <div className="flex items-center justify-end gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(false)}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors text-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-all text-sm shadow-lg shadow-rose-600/25"
                        >
                            Ya, Keluar
                        </button>
                    </div>
                )}
            >
                <div className="py-2 text-slate-300 text-sm space-y-2">
                    <p>Apakah Anda yakin ingin keluar dari akun SmartKos?</p>
                    <p className="text-xs text-slate-400">Anda perlu memasukkan email dan password kembali saat masuk.</p>
                </div>
            </Modal>
        </div>
    );
}
