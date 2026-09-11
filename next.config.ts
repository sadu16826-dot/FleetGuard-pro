import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Five 10 MB attachments plus multipart headers must survive the auth proxy.
  experimental: {
    proxyClientMaxBodySize: "52mb",
    authInterrupts: true,
  },
};

export default nextConfig;
