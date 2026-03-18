import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/user/:userId",
        destination: "/users/:userId",
        permanent: true,
      },
      {
        source: "/user/:userId/:path*",
        destination: "/users/:userId/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
