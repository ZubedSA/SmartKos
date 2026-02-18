"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import DataTable from "@/components/DataTable";

export default function PemasukanPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const supabase = createClient();

    useEffect(() => {
        fetchPemasukan();
    }, []);

    const fetchPemasukan = async () => {
        try {
            // Placeholder: Fetching from tagihan which have status 'lunas' as income
            const { data: income, error } = await supabase
                .from("tagihan")
                .select("*, penyewa(nama, kamar(nomor))")
                .eq("status", "lunas")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setData(income || []);
        } catch (error) {
            console.error("Error fetching income:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: "penyewa",
            label: "Sumber / Penyewa",
            render: (val) => (
                <div>
                    <p className="font-medium text-white">{val?.nama || "Pemasukan Umum"}</p>
                    <p className="text-xs text-slate-400">Kamar {val?.kamar?.nomor || "-"}</p>
                </div>
            )
        },
        {
            key: "bulan",
            label: "Periode",
            render: (val) => val || "-"
        },
        {
            key: "jumlah",
            label: "Nominal",
            render: (val) => (
                <span className="text-emerald-400 font-bold">
                    + Rp {val?.toLocaleString("id-ID")}
                </span>
            )
        },
        {
            key: "created_at",
            label: "Tanggal",
            render: (val) => new Date(val).toLocaleDateString("id-ID")
        }
    ];

    return (
        <div className="pb-24 lg:pb-0">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Riwayat Pemasukan</h1>
                <p className="text-slate-400 text-sm">Catatan uang masuk dari sewa kamar dan sumber lainnya.</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Pemasukan Bulan Ini</p>
                    <h2 className="text-3xl font-bold text-white">
                        Rp {data.reduce((acc, curr) => acc + (curr.jumlah || 0), 0).toLocaleString("id-ID")}
                    </h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-400">Memuat data...</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={data}
                    emptyMessage="Belum ada catatan pemasukan."
                />
            )}
        </div>
    );
}
