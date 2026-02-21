import "./globals.css";

export const metadata = {
    title: "SmartKos - Manajemen Kos Modern",
    description: "Aplikasi SaaS untuk manajemen kos-kosan. Kelola kamar, penyewa, tagihan, dan kirim notifikasi WhatsApp dengan mudah.",
    manifest: "/manifest.json",
};

export const viewport = {
    themeColor: "#0f172a",
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    shrinkToFit: "no",
    userScalable: "no",
    viewportFit: "cover",
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
