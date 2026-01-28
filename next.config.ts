import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 standalone 输出，用于 Docker 部署
  output: 'standalone',
  // Configure webpack for server-side native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native modules for server-side
      config.externals = config.externals || [];
      config.externals.push({
        'dockerode': 'commonjs dockerode',
        'ssh2': 'commonjs ssh2',
        'cpu-features': 'commonjs cpu-features',
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }
    return config;
  },
  // Server external packages
  serverExternalPackages: ['dockerode', 'ssh2', 'better-sqlite3'],

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
