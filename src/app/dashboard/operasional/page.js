"use client";

import { useState } from "react";

export default function OperasionalPage() {
    return (
        <div className="pb-24 lg:pb-0">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Biaya Operasional</h1>
                <p className="text-slate-400 text-sm">Kelola pengeluaran rutin untuk pemeliharaan dan utilitas kos.</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Pengeluaran Bulan Ini</p>
                    <h2 className="text-3xl font-bold text-white">
                        Rp 0
                    </h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center rotate-180">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
            </div>

            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <h3 className="text-white font-bold mb-1">Fitur Segera Hadir</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Fitur pencatatan biaya operasional sedang dalam tahap pengembangan.</p>
            </div>
        </div>
    );
}
