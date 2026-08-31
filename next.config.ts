import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['@duckdb/node-api'],
  outputFileTracingIncludes: {
    '/*': [
      './data/dataset/data/daily_snapshots.parquet',
      './data/dataset/data/latest_satellites.parquet',
    ],
  },
};

export default nextConfig;
