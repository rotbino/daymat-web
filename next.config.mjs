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
  async redirects() {
    return [
      { source: '/market', destination: '/markets', permanent: true },
      { source: '/market/', destination: '/markets', permanent: true },
    ];
  },
};

export default nextConfig;
