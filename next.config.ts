import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "xkakoecfzeiednklsrqd.supabase.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      { source: "/peleton", destination: "/tim", permanent: false },
      { source: "/peleton/:slug*", destination: "/tim/:slug*", permanent: false },
      { source: "/klasemen", destination: "/tim", permanent: false },
      { source: "/klasemen/:path*", destination: "/tim/:path*", permanent: false },
      { source: "/galeri", destination: "/tim", permanent: false },
      { source: "/galeri/:path*", destination: "/tim", permanent: false },
      { source: "/admin/galeri", destination: "/admin/peleton", permanent: false },
      { source: "/admin/verifikasi", destination: "/admin/peleton", permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ]
  },
};

export default nextConfig;
