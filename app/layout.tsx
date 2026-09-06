// app/layout.tsx
import React from "react";
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers/providers";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { FloatingAdminButton } from "@/app_/components/FloatingAdminButton";
import { AuthSync } from "@/app_/components/AuthSync";
import ClientLayout from "@/app_/ClientLayout";
import RefCapture from "@/app/components/RefCapture";

const vazirmatn = Vazirmatn({
    subsets: ["arabic"],
    variable: "--font-vazirmatn",
    display: "swap",
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    title: "Daymat | کاتالوگ روزانه قیمت  ",
    description: "Daymat ساخت کاتالوگ شخصی قیمت و نمایش قیمت در بازارهای تخصصی .",
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
                    <AuthSync />
                    <ClientLayout>
                        <RefCapture />
                        {children}
                    </ClientLayout>
            </ThemeProvider>
        </Providers>
        </body>
        </html>
    );
}