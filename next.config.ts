import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '*.trycloudflare.com',
    '*.loca.lt',
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.1.105:3000',
  ],
};

export default nextConfig;
