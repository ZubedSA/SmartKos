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
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    useEffect(() => {
        fetchPemasukan();
    }, [selectedKosId, selectedMonth, selectedYear]);

    const fetchPemasukan = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("tagihan")
                .select("id, bulan, jumlah, status, created_at, penyewa!inner(nama, kamar!inner(nomor, kos_id, kos(nama_kos)))")
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

    const searchFilteredData = data.filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const namaPenyewa = item.penyewa?.nama?.toLowerCase() || "";
        const nomorKamar = item.penyewa?.kamar?.nomor?.toString().toLowerCase() || "";
        const bulan = item.bulan?.toLowerCase() || "";
        const namaKos = item.penyewa?.kamar?.kos?.nama_kos?.toLowerCase() || "";

        return namaPenyewa.includes(q) || nomorKamar.includes(q) || bulan.includes(q) || namaKos.includes(q);
    });

    const columns = [
        {
            key: "penyewa",
            label: "Sumber / Penyewa",
            render: (val) => (
                <div>
                    <p className="font-semibold text-white">{val?.nama || "Pemasukan Umum"}</p>
                    <p className="text-xs text-slate-400">{val?.kamar?.kos?.nama_kos || ""} - Kamar {val?.kamar?.nomor || "-"}</p>
                </div>
            )
        },
        {
            key: "bulan",
            label: "Periode Sewa",
            render: (val) => (
                <span className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    {val || "-"}
                </span>
            )
        },
        {
            key: "jumlah",
            label: "Nominal",
            render: (val) => (
                <span className="text-emerald-400 font-bold text-sm">
                    + Rp {val?.toLocaleString("id-ID")}
                </span>
            )
        },
        {
            key: "created_at",
            label: "Tanggal Lunas",
            render: (val) => new Date(val).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
        }
    ];

    const getPeriodeLabel = () => {
        if (selectedMonth === "all" && selectedYear === "all") return "Semua Periode";
        if (selectedMonth === "all") return `Semua Bulan ${selectedYear}`;
        if (selectedYear === "all") return `${MONTHS[parseInt(selectedMonth)]} (Semua Tahun)`;
        return `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`;
    };

    const totalPemasukan = searchFilteredData.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);

    return (
        <div className="pb-24 lg:pb-0 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1e293b]/70 border border-[#334155] p-5 sm:p-6 rounded-2xl">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Riwayat Pemasukan</h1>
                    <p className="text-xs sm:text-sm text-slate-400">Catatan pembayaran sewa kamar yang telah berhasil diterima.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Search input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari nama, kamar, bulan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-60 pl-9 pr-4 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Month & Year Filter */}
                    <div className="flex gap-2 bg-[#0f172a] p-1 rounded-xl border border-slate-700">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-white text-xs font-medium px-2.5 py-1.5 focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-[#1e293b]">Semua Bulan</option>
                            {MONTHS.map((m, i) => <option key={m} value={i} className="bg-[#1e293b]">{m}</option>)}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent text-white text-xs font-medium px-2.5 py-1.5 focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-[#1e293b]">Semua Tahun</option>
                            {YEARS.map(y => <option key={y} value={y} className="bg-[#1e293b]">{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Total Summary Banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between shadow-xl">
                <div>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Pemasukan Sewa ({getPeriodeLabel()})</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                        Rp {totalPemasukan.toLocaleString("id-ID")}
                    </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 bg-[#1e293b] rounded-2xl border border-[#334155]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={searchFilteredData}
                    emptyMessage="Belum ada catatan pemasukan pada periode ini."
                />
            )}
        </div>
    );
}
