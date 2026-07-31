/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  compress: true,

  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],

    deviceSizes: [360, 390, 430, 640, 768, 1024, 1280],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;