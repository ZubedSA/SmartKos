"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createClient } from "@/lib/supabase";

export default function AdminApprovalsPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: "info",
        title: "",
        message: "",
        onConfirm: () => { },
        loading: false
    });

    const supabase = createClient();

    useEffect(() => {
        fetchUnapprovedUsers();
    }, []);

    const fetchUnapprovedUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("is_approved", false)
            .eq("role", "owner")
            .order("created_at", { ascending: false });

        if (!error) {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleApprove = (user) => {
        setConfirmModal({
            isOpen: true,
            type: "success",
            title: "Setujui User",
            message: `Apakah Anda yakin ingin menyetujui pendaftaran ${user.name}? User ini akan mendapatkan akses penuh ke dashboard.`,
            confirmText: "Setujui Sekarang",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, loading: true }));
                const { error } = await supabase
                    .from("users")
                    .update({ is_approved: true })
                    .eq("id", user.id);

                if (error) {
                    alert("Gagal menyetujui user: " + error.message);
                } else {
                    fetchUnapprovedUsers();
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            }
        });
    };

    const handleReject = (user) => {
        setConfirmModal({
            isOpen: true,
            type: "danger",
            title: "Tolak Pendaftaran",
            message: `Apakah Anda yakin ingin menolak pendaftaran ${user.name}? Data profil user ini akan dihapus.`,
            confirmText: "Tolak & Hapus",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, loading: true }));
                const { error } = await supabase
                    .from("users")
                    .delete()
                    .eq("id", user.id);

                if (error) {
                    alert("Gagal menolak user: " + error.message);
                } else {
                    fetchUnapprovedUsers();
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            }
        });
    };

    const columns = [
        {
            key: "name",
            label: "Nama",
            render: (val, row) => (
                <div>
                    <p className="font-medium text-white">{val}</p>
                    <p className="text-xs text-slate-400">{row.email}</p>
                </div>
            ),
        },
        {
            key: "created_at",
            label: "Mendaftar",
            render: (val) => (
                <span className="text-sm text-slate-400">
                    {new Date(val).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </span>
            ),
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Persetujuan User</h1>
                <p className="text-slate-400">Tinjau dan setujui pendaftaran user baru.</p>
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
                    data={users}
                    emptyMessage="Tidak ada pendaftaran baru yang menunggu persetujuan."
                    actions={(row) => (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleApprove(row)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                                Setujui
                            </button>
                            <button
                                onClick={() => handleReject(row)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                                Tolak
                            </button>
                        </div>
                    )}
                />
            )}

            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
