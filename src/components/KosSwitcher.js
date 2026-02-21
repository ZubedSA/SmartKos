"use client";

import { useKos } from "@/context/KosContext";
import { useState, useRef, useEffect } from "react";

export default function KosSwitcher({ variant = "sidebar" }) {
    const { kosList, selectedKosId, setSelectedKosId, activeKos, isLoadingKos } = useKos();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoadingKos && kosList.length === 0) {
        return (
            <div className={`px-4 py-3 animate-pulse bg-slate-800/50 rounded-xl ${variant === "mobile" ? "w-full" : "mx-4 mt-4"}`}>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
        );
    }

    const currentLabel = selectedKosId === "all" ? "Semua Kos" : activeKos?.nama_kos || "Pilih Kos";

    return (
        <div className={`relative ${variant === "mobile" ? "w-full" : "mx-4 mt-4 mb-2"}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 
                    ${variant === "sidebar"
                        ? "bg-[#334155]/50 border border-[#475569]/30 text-white hover:bg-[#334155]"
                        : "bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 shadow-lg"
                    }`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 
                        ${selectedKosId === "all" ? "bg-indigo-500" : "bg-purple-500 shadow-lg shadow-purple-500/20"}`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] leading-none mb-0.5">Prop. Aktif</p>
                        <p className="text-sm font-bold truncate tracking-tight">{currentLabel}</p>
                    </div>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className={`absolute left-0 right-0 z-[60] mt-2 py-2 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 top-full`}>
                    <button
                        onClick={() => {
                            setSelectedKosId("all");
                            setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                            ${selectedKosId === "all" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-300 hover:bg-[#334155] hover:text-white"}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${selectedKosId === "all" ? "bg-indigo-400" : "bg-slate-600"}`}></div>
                        Semua Kos
                    </button>

                    <div className="my-1 border-t border-[#334155]"></div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {kosList.map((kos) => (
                            <button
                                key={kos.id}
                                onClick={() => {
                                    setSelectedKosId(kos.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                                    ${selectedKosId === kos.id ? "bg-purple-500/10 text-purple-400" : "text-slate-300 hover:bg-[#334155] hover:text-white"}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${selectedKosId === kos.id ? "bg-purple-400" : "bg-slate-600"}`}></div>
                                {kos.nama_kos}
                            </button>
                        ))}
                    </div>

                    <Link
                        href="/dashboard/kos"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 mt-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Kelola Properti
                    </Link>
                </div>
            )}
        </div>
    );
}

// Add Link import for internal use
import Link from "next/link";
