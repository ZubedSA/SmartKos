import "./globals.css";

export const metadata = {
    title: "SmartKos - Manajemen Kos Modern",
    description: "Aplikasi SaaS untuk manajemen kos-kosan. Kelola kamar, penyewa, tagihan, dan kirim notifikasi WhatsApp dengan mudah.",
    manifest: "/manifest.json",
    viewport: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover",
    themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
