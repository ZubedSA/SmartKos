"use client";

import React from "react";

export default function KwitansiTemplate({ config, data, id = "printable-receipt" }) {
    const namaBisnis = config?.nama_bisnis || data?.nama_kos || "SMARTKOS MANAGEMENT";
    const alamatBisnis = config?.alamat_bisnis || "Lokasi Properti Kos";
    const kontakBisnis = config?.kontak_bisnis || "Telp / WA: -";
    const pesan = config?.pesan_tambahan || "Terima kasih atas pembayaran Anda. Simpan kwitansi ini sebagai bukti pembayaran resmi.";

    const rawId = data?.id ? data.id.toString() : "20260001";
    const noKwitansi = data?.no_kwitansi || `#KW-${rawId.slice(-8).toUpperCase()}`;
    const tanggal = data?.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const namaPenyewa = data?.nama_penyewa || data?.penyewa?.nama || "Penyewa";
    const namaKos = data?.nama_kos || data?.penyewa?.kamar?.kos?.nama_kos || "SmartKos";
    const nomorKamar = data?.nomor_kamar || data?.penyewa?.kamar?.nomor || "-";
    const bulan = data?.bulan || "Oktober 2026";
    const rawJumlah = data?.jumlah !== undefined ? data.jumlah : (data?.nominal || 0);
    const formattedJumlah = typeof rawJumlah === "number" ? rawJumlah.toLocaleString("id-ID") : rawJumlah;

    return (
        <div id={id} className="bg-white text-slate-900 font-sans rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 relative overflow-hidden text-left max-w-2xl mx-auto">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600"></div>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 mb-5 border-b border-slate-100 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-500/20">
                            SK
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                            {namaBisnis}
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                        {alamatBisnis}
                    </p>
                    <p className="text-[11px] font-semibold text-indigo-600 mt-1">
                        {kontakBisnis}
                    </p>
                </div>

                <div className="text-left sm:text-right border-l-2 sm:border-l-0 border-indigo-500 pl-3 sm:pl-0">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md mb-1 border border-indigo-100">
                        KWITANSI PEMBAYARAN
                    </span>
                    <h3 className="text-sm font-mono font-bold text-slate-900">{noKwitansi}</h3>
                    <p className="text-xs text-slate-500">{tanggal}</p>
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-5 text-xs">
                <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Sudah Diterima Dari</span>
                    <span className="font-bold text-slate-800 text-sm">{namaPenyewa}</span>
                </div>
                <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Properti & Kamar</span>
                    <span className="font-bold text-slate-800 text-sm">{namaKos} — Kamar {nomorKamar}</span>
                </div>
                <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Periode Tagihan</span>
                    <span className="font-semibold text-slate-700">{bulan}</span>
                </div>
                <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Status Pembayaran</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        LUNAS / PAID
                    </span>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                            <th className="py-2.5 px-4">Deskripsi Pembayaran</th>
                            <th className="py-2.5 px-4 text-center">Periode</th>
                            <th className="py-2.5 px-4 text-right">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td className="py-3 px-4 text-slate-800 font-medium">
                                Sewa Kamar Kos #{nomorKamar} ({namaKos})
                            </td>
                            <td className="py-3 px-4 text-center text-slate-500 font-medium">
                                {bulan}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                                Rp {formattedJumlah}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Total Highlight */}
            <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl p-4 mb-5 shadow-sm">
                <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Total Nominal Diterima</span>
                    <span className="text-xs text-slate-300 font-medium italic">Pembayaran telah dikonfirmasi sah</span>
                </div>
                <div className="text-right">
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-400">
                        Rp {formattedJumlah}
                    </span>
                </div>
            </div>

            {/* Footer / Notes & Signature */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-3 border-t border-slate-100">
                <div className="max-w-xs text-left">
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">
                        "{pesan}"
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1.5">
                        Dokumen kwitansi ini diterbitkan secara otomatis oleh SmartKos System.
                    </p>
                </div>

                <div className="text-center min-w-[140px] pt-4">
                    <p className="text-[10px] text-slate-400 font-semibold mb-6">{tanggal}</p>
                    <div className="w-28 border-b border-slate-400 mx-auto mb-1"></div>
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Pengelola Kos</p>
                </div>
            </div>
        </div>
    );
}
