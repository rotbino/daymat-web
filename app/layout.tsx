// app/layout.tsx
import React from "react";
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers/providers";
import { ArmProvider } from "@/lib/providers/ArmProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { FloatingAdminButton } from "@/app/components/FloatingAdminButton";
import { AuthSync } from "@/app/components/AuthSync";
import ClientLayout from "@/app/ClientLayout";

const vazirmatn = Vazirmatn({
    subsets: ["arabic"],
    variable: "--font-vazirmatn",
    display: "swap",
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    title: "Daymat | زیر ساخت بازار عمده فروشی B2B",
    description: "Daymat اصناف مرتبط را به هم وصل می کند.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#610000",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fa" dir="rtl" suppressHydrationWarning>
        <body className={`${vazirmatn.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <Providers>
            <ThemeProvider>
                <ArmProvider>
                    <AuthSync />
                    <ClientLayout>
                        {children}
                    </ClientLayout>
                </ArmProvider>
            </ThemeProvider>
        </Providers>
        </body>
        </html>
    );
}