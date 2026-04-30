import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Video-Creator-Worker: Proxy läuft als Route-Handler
// (src/app/api/video-creator/[...path]/route.ts), nicht als Rewrite —
// das umgeht Build-Time-ENV-Caching und erlaubt Streaming von grossen
// Upload-Bodies mit korrektem Header-Durchreichen.
const nextConfig: NextConfig = {};

// ANALYZE=true npm run build → öffnet Bundle-Visualization im Browser.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
