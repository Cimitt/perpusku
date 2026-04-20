import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'epulaiwduyiznhnuikxc.supabase.co', // Domain Supabase Anda
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos', // Tambahkan ini untuk mengizinkan gambar dummy
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
