import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Video-Creator-Worker läuft auf Hetzner, für den Browser transparent
    // über die Hauptdomain. Setzt VIDEO_CREATOR_INTERNAL_URL in Vercel,
    // z.B. https://vc.herr.tech (nicht NEXT_PUBLIC — server-only).
    const workerUrl = process.env.VIDEO_CREATOR_INTERNAL_URL;
    if (!workerUrl) return [];

    return [
      {
        source: "/api/video-creator/:path*",
        destination: `${workerUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
