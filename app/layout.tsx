import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "WOTC Admin",
    description: "Wisdom of the Crowds Admin Panel",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body>{children}</body>
        </html>
    );
}
