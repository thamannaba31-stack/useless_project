import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the meme images to be served from public/memes
  // Increase body size limit for image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  // Required for sharp on Vercel
  outputFileTracingIncludes: {
    "/api/compose": ["./node_modules/sharp/**/*"],
  },
};

export default nextConfig;
