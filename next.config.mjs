/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // ✅ /market (مسیر قدیمی) → /markets — صفحهٔ لیست و جستجوی بازارها
  //    هر دو سورس (با و بدون اسلش) برای اطمینان در کنار trailingSlash
  // ✅ /inquiries (دیوار عمومی کاتالوگ‌های خرید) → /my-inquiries
  //    تصمیم مالک: صفحه‌های خرید در دیوار عمومی نمایش داده نمی‌شوند؛
  //    خانهٔ آن‌ها پنل خود کاربر است (بازارها در گام بعد).
  async redirects() {
    return [
      { source: '/market', destination: '/markets', permanent: true },
      { source: '/market/', destination: '/markets', permanent: true },
      { source: '/inquiries', destination: '/my-inquiries', permanent: false },
      { source: '/inquiries/', destination: '/my-inquiries', permanent: false },
    ];
  },
};

export default nextConfig;
