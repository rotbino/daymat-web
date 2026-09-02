// app/c/dashboard/page.tsx
import { redirect } from 'next/navigation';

/**
 * روت استاتیک محافظ: چون استاتیک بر [slug] مقدم است، /c/dashboard
 * دیگر به‌عنوان کاتالوگی با slug='dashboard' تفسیر نمی‌شود.
 * بدون slug نمی‌دانیم کدام کاتالوگ مد نظر است → به فهرست کاتالوگ‌ها هدایت کن.
 */
export default function CatalogDashboardAliasPage() {
    redirect('/profile');
}