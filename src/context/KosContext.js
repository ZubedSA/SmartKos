"use client";

import { createContext, useContext, useState, useEffect } from "react";

const KosContext = createContext();

export function KosProvider({ children }) {
    const [selectedKosId, setSelectedKosId] = useState("all");
    const [kosList, setKosList] = useState([]);
    const [isLoadingKos, setIsLoadingKos] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("selectedKosId");
        if (saved) {
            setSelectedKosId(saved);
        }
    }, []);

    // Save to localStorage when changed
    useEffect(() => {
        if (selectedKosId) {
            localStorage.setItem("selectedKosId", selectedKosId);
        }
    }, [selectedKosId]);

    const activeKos = kosList.find(k => k.id === selectedKosId);

    return (
        <KosContext.Provider value={{
            selectedKosId,
            setSelectedKosId,
            kosList,
            setKosList,
            activeKos,
            isLoadingKos,
            setIsLoadingKos
        }}>
            {children}
        </KosContext.Provider>
    );
}

export function useKos() {
    const context = useContext(KosContext);
    if (!context) {
        throw new Error("useKos must be used within a KosProvider");
    }
    return context;
}
