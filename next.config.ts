import type { NextConfig } from "next";

// Video-Creator-Worker: Proxy läuft als Route-Handler
// (src/app/api/video-creator/[...path]/route.ts), nicht als Rewrite —
// das umgeht Build-Time-ENV-Caching und erlaubt Streaming von grossen
// Upload-Bodies mit korrektem Header-Durchreichen.
const nextConfig: NextConfig = {};

export default nextConfig;
