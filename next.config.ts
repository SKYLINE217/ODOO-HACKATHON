import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
      "frame-src https://accounts.google.com",
    ].join('; ')
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
]

// Prevent browser from caching authenticated dashboard pages
// This is the key fix for back-button post-logout bypass
const noCacheHeaders = [
  { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
]

const DASHBOARD_ROUTES = [
  '/', '/vendors', '/rfqs', '/quotations', '/purchase-orders',
  '/invoices', '/approvals', '/reports', '/activity', '/profile',
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Apply no-cache to every dashboard route
      ...DASHBOARD_ROUTES.map(route => ({
        source: route,
        headers: noCacheHeaders,
      })),
    ]
  },
};

export default nextConfig;
