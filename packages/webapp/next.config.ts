import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "img-src 'self' https://*.supabase.co",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self' https://*.supabase.co",
].join("; ");

export async function headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: csp,
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Concrete array type (not possibly undefined)
type RemotePatterns = NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>;
const remotePatterns: RemotePatterns = [];

if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    const proto = url.protocol.replace(":", "");
    if (proto !== "https" && proto !== "http") {
      throw new Error(`Unsupported protocol in NEXT_PUBLIC_SUPABASE_URL: ${url.protocol}`);
    }

    // Only allow the Supabase storage public path
    remotePatterns.push({
      protocol: proto as "http" | "https",
      hostname: url.hostname,
      pathname: "/storage/v1/object/public/**",
      ...(url.port ? { port: url.port } : {}),
    });
  } catch (e) {
    // In production, fail fast so misconfiguration is caught
    if (process.env.NODE_ENV === "production") {
      throw e;
    } else {
      // Dev: warn and continue with empty remotePatterns
      // eslint-disable-next-line no-console
      console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL, image remotePatterns disabled:", e);
    }
  }
} else if (process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required in production");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
