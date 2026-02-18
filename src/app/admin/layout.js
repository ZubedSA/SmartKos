"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase";

const adminMenuItems = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
    },
    {
        href: "/admin/users",
        label: "Users",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
];

export default function AdminLayout({ children }) {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();
                setUser(profile);
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-[#0f172a]">
            <Sidebar
                items={adminMenuItems}
                title="Admin Panel"
                user={user}
                onLogout={handleLogout}
            />

            {/* Mobile header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1e293b] border-b border-[#334155] flex items-center justify-center px-4 z-40">
                <h1 className="text-lg font-bold gradient-text">SmartKos Admin</h1>
            </div>

            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
