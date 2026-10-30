import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable Webpack disk pack file cache in local development on Windows to prevent Array buffer allocation failure
      config.cache = false;
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@gold-commerce/shared-types", "@gold-commerce/validation"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/admin/hero",
        destination: "/admin/navbar",
        permanent: false,
      },
      {
        source: "/admin/hero-images",
        destination: "/admin/navbar",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const rawApi = process.env.NEXT_PUBLIC_API_URL || "";
    const apiOrigin = rawApi ? rawApi.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "") : "";
    const rawBackendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      apiOrigin ||
      "http://localhost:4000";
    const backendUrl = rawBackendUrl.replace(/\/+$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
