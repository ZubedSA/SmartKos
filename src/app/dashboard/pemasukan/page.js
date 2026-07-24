"use client";

import { useState, useEffect } from "react";
import { useKos } from "@/context/KosContext";
import { createClient } from "@/lib/supabase";
import DataTable from "@/components/DataTable";

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function PemasukanPage() {
    const { selectedKosId } = useKos();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");

    const supabase = createClient();

    useEffect(() => {
        fetchPemasukan();
    }, [selectedKosId, selectedMonth, selectedYear]);

    const fetchPemasukan = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("tagihan")
                .select("id, bulan, jumlah, status, created_at, penyewa!inner(nama, kamar!inner(nomor, kos_id))")
                .eq("status", "lunas")
                .order("created_at", { ascending: false });

            if (selectedKosId !== "all") {
                query = query.eq("penyewa.kamar.kos_id", selectedKosId);
            }

            const { data: income, error } = await query;
            if (error) throw error;

            let filtered = income || [];

            if (selectedMonth !== "all" || selectedYear !== "all") {
                filtered = filtered.filter(item => {
                    if (!item.bulan) return false;
                    const parts = item.bulan.split(" ");
                    const monthName = parts[0];
                    const yearNum = parts[1] ? parseInt(parts[1], 10) : new Date(item.created_at).getFullYear();

                    if (selectedMonth !== "all") {
                        const targetMonthName = MONTHS[parseInt(selectedMonth, 10)];
                        if (monthName !== targetMonthName) return false;
                    }

                    if (selectedYear !== "all") {
                        const targetYear = parseInt(selectedYear, 10);
                        if (yearNum !== targetYear) return false;
                    }

                    return true;
                });
            }

            setData(filtered);
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

    const getPeriodeLabel = () => {
        if (selectedMonth === "all" && selectedYear === "all") return "Semua Periode";
        if (selectedMonth === "all") return `Semua Bulan ${selectedYear}`;
        if (selectedYear === "all") return `${MONTHS[parseInt(selectedMonth)]} (Semua Tahun)`;
        return `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`;
    };

    return (
        <div className="pb-24 lg:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Riwayat Pemasukan</h1>
                    <p className="text-slate-400 text-sm">Catatan uang masuk dari sewa kamar dan sumber lainnya.</p>
                </div>

                {/* Month & Year Filter */}
                <div className="flex gap-2 bg-[#1e293b] p-1.5 rounded-2xl border border-slate-700 w-full md:w-auto">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-white text-sm font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-[#1e293b]">Semua Bulan</option>
                        {MONTHS.map((m, i) => <option key={m} value={i} className="bg-[#1e293b]">{m}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent text-white text-sm font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-[#1e293b]">Semua Tahun</option>
                        {YEARS.map(y => <option key={y} value={y} className="bg-[#1e293b]">{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Pemasukan ({getPeriodeLabel()})</p>
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
                    emptyMessage="Belum ada catatan pemasukan pada periode ini."
                />
            )}
        </div>
    );
}
