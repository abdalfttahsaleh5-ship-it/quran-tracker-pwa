import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // 1. Supabase REST, Auth, Realtime, GraphQL, and Database Endpoints -> NetworkOnly (NEVER CACHE)
      {
        urlPattern: /^https?:\/\/.*\.supabase\.(?:co|in)\/(?:rest|auth|graphql|realtime|storage)\/v1\/.*/i,
        handler: "NetworkOnly",
        options: {
          cacheName: "supabase-endpoints-network-only",
        },
      },
      {
        urlPattern: /^https?:\/\/.*\.supabase\.(?:co|in)\/.*/i,
        handler: "NetworkOnly",
        options: {
          cacheName: "supabase-all-network-only",
        },
      },
      // 2. API Routes -> NetworkOnly (NEVER CACHE)
      {
        urlPattern: ({ url: { pathname } }) => pathname.startsWith("/api/"),
        handler: "NetworkOnly",
        options: {
          cacheName: "api-network-only",
        },
      },
      // 3. Next.js RSC Payloads (_rsc query, headers, or RSC prefetch) -> NetworkOnly (NEVER CACHE)
      {
        urlPattern: ({ request, url: { search, pathname } }) =>
          request.headers.get("RSC") === "1" ||
          request.headers.get("Next-Router-Prefetch") === "1" ||
          request.headers.get("Next-Router-State-Tree") !== null ||
          search.includes("_rsc=") ||
          pathname.includes("_rsc"),
        handler: "NetworkOnly",
        options: {
          cacheName: "rsc-network-only",
        },
      },
      // 4. Dynamic HTML Page Navigation (dashboard, students, parent, root, etc.) -> NetworkOnly (NEVER CACHE)
      {
        urlPattern: ({ request, url: { pathname }, sameOrigin }) =>
          sameOrigin &&
          (request.mode === "navigate" ||
            pathname === "/" ||
            pathname.startsWith("/students") ||
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/parent") ||
            pathname.startsWith("/login") ||
            pathname.startsWith("/attendance")),
        handler: "NetworkOnly",
        options: {
          cacheName: "pages-network-only",
        },
      },
      // 5. External Google Fonts (Webfonts & Stylesheets) -> CacheFirst
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 31536000 },
        },
      },
      // 6. Static Font Assets -> CacheFirst
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-font-assets",
          expiration: { maxEntries: 16, maxAgeSeconds: 31536000 },
        },
      },
      // 7. Static Next.js Bundles (Immutable Content-Hashed JS/CSS) -> CacheFirst
      {
        urlPattern: /\/_next\/static\/.+\.(?:js|css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 31536000 },
        },
      },
      // 8. Static Images & Icons -> StaleWhileRevalidate
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 2592000 },
        },
      },
      // 9. PWA Manifest & App Icons -> StaleWhileRevalidate
      {
        urlPattern: /\/(?:manifest\.json|icons\/.*)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-manifest-icons",
          expiration: { maxEntries: 16, maxAgeSeconds: 604800 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/:all*(svg|jpg|png|webp|avif|woff2|woff|ttf|css|js)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
