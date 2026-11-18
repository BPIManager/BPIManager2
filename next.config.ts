import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for its runtime inline scripts
  "script-src 'self' https://www.googletagmanager.com https://apis.google.com https://static.cloudflareinsights.com https://challenges.cloudflare.com 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://www.google-analytics.com https://region1.google-analytics.com https://*.analytics.google.com https://www.google.com",
  "frame-src 'self' https://bpimv2.firebaseapp.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

// API v1 の廃止予告（#673）。日付は日本時間の 0 時で、Deprecation は 2026-11-19、Sunset は 2027-01-01
const V1_DEPRECATION = `@${Date.UTC(2026, 10, 18, 15, 0, 0) / 1000}`;
const V1_SUNSET = new Date(Date.UTC(2026, 11, 31, 15, 0, 0)).toUTCString();
const V1_MIGRATION_GUIDE_URL =
  "https://bpim2.apidog.io/%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9Bv1-api%E3%81%AE%E5%BB%83%E6%AD%A2%E3%81%A8v2-api%E3%81%B8%E3%81%AE%E7%A7%BB%E8%A1%8C%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6-2527122m0";

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
      {
        // v2 は v1 の全ルートを持つため、同じパスの v2 を successor-version として示す
        source: "/api/v1/:path*",
        headers: [
          { key: "Deprecation", value: V1_DEPRECATION },
          { key: "Sunset", value: V1_SUNSET },
          {
            key: "Link",
            value: `</api/v2/:path*>; rel="successor-version", <${V1_MIGRATION_GUIDE_URL}>; rel="deprecation"; type="text/html"`,
          },
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

  async rewrites() {
    return [
      {
        source: "/.well-known/oauth-authorization-server",
        destination: "/api/oauth/authorization-server-metadata",
      },
      {
        source: "/.well-known/oauth-protected-resource",
        destination: "/api/oauth/protected-resource-metadata",
      },
    ];
  },
};

export default nextConfig;
