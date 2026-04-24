import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for its runtime inline scripts
  "script-src 'self' https://www.googletagmanager.com https://apis.google.com https://static.cloudflareinsights.com 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://www.google-analytics.com https://www.google.com",
  "frame-src 'self' https://bpimv2.firebaseapp.com",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  serverExternalPackages: [
    "discord.js",
    "@discordjs/ws",
    "@discordjs/rest",
    "zlib-sync",
  ],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

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
