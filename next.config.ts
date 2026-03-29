import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  serverExternalPackages: [
    "discord.js",
    "@discordjs/ws",
    "@discordjs/rest",
    "zlib-sync",
  ],

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
