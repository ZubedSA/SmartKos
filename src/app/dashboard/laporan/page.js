"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import DataTable from "@/components/DataTable";
import { formatRupiah } from "@/lib/whatsapp";

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function LaporanPage() {
    const [loading, setLoading] = useState(true);
    const [incomeData, setIncomeData] = useState([]);
    const [expenseData, setExpenseData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch income (lunas tagihan)
            const { data: income, error: incomeError } = await supabase
                .from("tagihan")
                .select("id, bulan, jumlah, status, created_at, penyewa(nama)")
                .eq("status", "lunas");

            if (incomeError) throw incomeError;

            let filteredIncome = income || [];
            if (selectedMonth !== "all" || selectedYear !== "all") {
                filteredIncome = filteredIncome.filter(item => {
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

            // Fetch expenses (operasional)
            let expenseQuery = supabase
                .from("operasional")
                .select("id, keterangan, jumlah, tanggal, kategori");

            if (selectedYear !== "all" && selectedMonth !== "all") {
                const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1).toISOString().split("T")[0];
                const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0).toISOString().split("T")[0];
                expenseQuery = expenseQuery.gte("tanggal", startDate).lte("tanggal", endDate);
            } else if (selectedYear !== "all") {
                const startDate = `${selectedYear}-01-01`;
                const endDate = `${selectedYear}-12-31`;
                expenseQuery = expenseQuery.gte("tanggal", startDate).lte("tanggal", endDate);
            }

            const { data: expenses, error: expenseError } = await expenseQuery;
            if (expenseError) throw expenseError;

            let filteredExpenses = expenses || [];
            if (selectedMonth !== "all" && selectedYear === "all") {
                const targetMonth = parseInt(selectedMonth, 10);
                filteredExpenses = filteredExpenses.filter(item => new Date(item.tanggal).getMonth() === targetMonth);
            }

            setIncomeData(filteredIncome);
            setExpenseData(filteredExpenses);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalIncome = incomeData.reduce((acc, curr) => acc + curr.jumlah, 0);
    const totalExpense = expenseData.reduce((acc, curr) => acc + curr.jumlah, 0);
    const netBalance = totalIncome - totalExpense;

    const combinedHistory = [
        ...incomeData.map(item => ({
            id: `in-${item.id}`,
            date: item.created_at,
            title: `Sewa: ${item.penyewa?.nama || "Penyewa"}`,
            category: "Pemasukan",
            amount: item.jumlah,
            type: "income"
        })),
        ...expenseData.map(item => ({
            id: `ex-${item.id}`,
            date: item.tanggal,
            title: item.keterangan,
            category: item.kategori,
            amount: item.jumlah,
            type: "expense"
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const columns = [
        {
            key: "title",
            label: "Keterangan",
            render: (val, row) => (
                <div>
                    <p className="font-medium text-white">{val}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{row.category}</p>
                </div>
            )
        },
        {
            key: "date",
            label: "Tanggal",
            render: (val) => new Date(val).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })
        },
        {
            key: "amount",
            label: "Nominal",
            render: (val, row) => (
                <span className={`font-bold ${row.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {row.type === 'income' ? '+' : '-'} Rp {formatRupiah(val)}
                </span>
            )
        }
    ];

    return (
        <div className="pb-24 lg:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Laporan Rekapitulasi</h1>
                    <p className="text-slate-400 text-sm">Analisis arus kas masuk dan keluar kos Anda.</p>
                </div>
                <div className="flex gap-2 bg-[#1e293b] p-1 rounded-2xl border border-slate-700 w-full md:w-auto">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-white text-sm font-medium px-4 py-2 focus:outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-[#1e293b]">Semua Bulan</option>
                        {MONTHS.map((m, i) => <option key={m} value={i} className="bg-[#1e293b]">{m}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent text-white text-sm font-medium px-4 py-2 focus:outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-[#1e293b]">Semua Tahun</option>
                        {YEARS.map(y => <option key={y} value={y} className="bg-[#1e293b]">{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 text-emerald-400/80">Total Pemasukan</p>
                    <h3 className="text-2xl font-black text-white">Rp {formatRupiah(totalIncome)}</h3>
                </div>
                <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform rotate-180">
                        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 text-red-400/80">Total Pengeluaran</p>
                    <h3 className="text-2xl font-black text-white">Rp {formatRupiah(totalExpense)}</h3>
                </div>
                <div className={`bg-gradient-to-br ${netBalance >= 0 ? 'from-indigo-600 to-purple-600' : 'from-rose-600 to-red-600'} rounded-2xl p-6 shadow-2xl relative overflow-hidden group`}>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Saldo Neto</p>
                    <h3 className="text-2xl font-black text-white">Rp {formatRupiah(netBalance)}</h3>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black text-white uppercase italic">
                        {netBalance >= 0 ? 'Surplus' : 'Defisit'}
                    </div>
                </div>
            </div>

            <div className="bg-[#1e293b] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl transition-all">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Riwayat Transaksi</h2>
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] text-slate-400 font-bold uppercase">
                        {combinedHistory.length} Record
                    </span>
                </div>
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={combinedHistory}
                        emptyMessage="Tidak ada transaksi pada periode ini."
                    />
                )}
            </div>
        </div>
    );
}
