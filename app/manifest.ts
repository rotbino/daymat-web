// app/manifest.ts
// ✅ مانیفست PWA دیمت — Next.js به‌صورت خودکار <link rel="manifest"> را اضافه می‌کند
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "دیمت | کاتالوگ روزانه قیمت",
        short_name: "دیمت",
        description: "کاتالوگ شخصی قیمت و نمایش قیمت در بازارهای تخصصی",
        dir: "rtl",
        lang: "fa-IR",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        background_color: "#ffffff",
        theme_color: "#610000",
        categories: ["business", "shopping", "productivity"],
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/maskable-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icons/maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
