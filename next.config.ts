import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router doesn't support i18n config in next.config.js
  // We'll handle routing manually with middleware

  // Environment variables
  env: {
    PORT: process.env.PORT || "8000",
  },

  // Experimental features
  experimental: {
    // Enable Turbopack for faster builds
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
};

export default nextConfig;
