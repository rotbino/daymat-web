// app/layout.tsx
import React from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers/providers";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { FloatingAdminButton } from "@/app_/components/FloatingAdminButton";
import { AuthSync } from "@/app_/components/AuthSync";
import ClientLayout from "@/app_/ClientLayout";
import RefCapture from "@/app/components/RefCapture";
import { PwaInstaller } from "@/app/components/pwa/PwaInstaller";

const vazirmatn = Vazirmatn({
    subsets: ["arabic"],
    variable: "--font-vazirmatn",
    display: "swap",
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    title: "Daymat | کاتالوگ روزانه قیمت  ",
    description: "Daymat ساخت کاتالوگ شخصی قیمت و نمایش قیمت در بازارهای تخصصی .",
    applicationName: "دیمت",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "دیمت",
    },
    icons: {
        icon: "/images/favicon.ico",
        apple: "/icons/apple-touch-icon.png",
    },
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
        {/* ضبط زودهنگام beforeinstallprompt — قبل از هیدریشن تا رخداد از دست نرود */}
        <Script id="dm-pwa-capture" strategy="beforeInteractive">
            {`window.__dmInstallEvt = null;
            window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                window.__dmInstallEvt = e;
            });
            window.addEventListener('appinstalled', function () {
                try {
                    localStorage.setItem('dm.pwa', JSON.stringify({ s: 'i', t: Date.now() }));
                } catch (err) {}
            });`}
        </Script>
        <Providers>
            <ThemeProvider>
                    <AuthSync />
                    <ClientLayout>
                        <RefCapture />
                        {children}
                    </ClientLayout>
                    <PwaInstaller />
            </ThemeProvider>
        </Providers>
        </body>
        </html>
    );
}