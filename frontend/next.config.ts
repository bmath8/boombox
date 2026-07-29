import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

// Type declaration for process.env access in config
declare const process: {
  env: {
    NODE_ENV: string;
    ANALYZE?: string;
    [key: string]: string | undefined;
  };
};

const nextConfig: NextConfig = {
  // ============================================================================
  // OUTPUT & BUILD
  // ============================================================================

  // Enable standalone output for Docker (reduces image size by 80%)
  output: 'standalone',

  // ============================================================================
  // PERFORMANCE & OPTIMIZATION
  // ============================================================================

  // Compress output
  compress: true,

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },

  // ============================================================================
  // SECURITY HEADERS
  // ============================================================================

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? [
                // Production CSP - Updated to allow React inline event handlers
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://sdk.scdn.co",
                "style-src 'self' 'unsafe-inline'", // Required for React inline styles & Tailwind
                "img-src 'self' data: https: blob:",
                "font-src 'self' data:",
                "connect-src 'self' https://*.supabase.co wss://*.supabase.co wss://* https://api.spotify.com",
                "media-src 'self' https:",
                "frame-src 'self' https://open.spotify.com https://sdk.scdn.co",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests"
              ].join('; ')
              : [
                // Development CSP - Relaxed for DevTools
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://sdk.scdn.co",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data:",
                "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* wss://* https://api.spotify.com",
                "media-src 'self' https:",
                "frame-src 'self' https://open.spotify.com https://sdk.scdn.co",
              ].join('; ')
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ];
  },

  // ============================================================================
  // REDIRECTS & REWRITES
  // ============================================================================

  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================

  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dropdown-menu'],

    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Turbopack is the default bundler in Next.js 16
  // No custom config needed - Next.js handles everything automatically

  // NOTE: Custom webpack config removed for Next.js 16 compatibility
  // Next.js 16 handles bundling automatically with Turbopack

  // ============================================================================
  // ENVIRONMENT VARIABLES
  // ============================================================================

  env: {
    NEXT_PUBLIC_APP_VERSION: process.env['npm_package_version'] || '1.0.0',
  },

  // ============================================================================
  // LOGGING
  // ============================================================================

  // Configure logging level
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);
