import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Allow camera access in development
          ...(process.env.NODE_ENV === 'development' ? [
            {
              key: 'Permissions-Policy',
              value: 'camera=*, microphone=*',
            }
          ] : []),
        ],
      },
    ];
  },
  serverExternalPackages: [],
};

export default nextConfig;
