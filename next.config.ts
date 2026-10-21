import type { NextConfig } from "next";

// Varje bygge får en egen version, så att appen märker när en ny är publicerad.
// Sparas i process.env så att alla delar av bygget får samma värde.
process.env.NEXT_PUBLIC_APP_VERSION ??= process.env.GITHUB_SHA ?? Date.now().toString(36);
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_APP_VERSION: appVersion },
};

export default nextConfig;
