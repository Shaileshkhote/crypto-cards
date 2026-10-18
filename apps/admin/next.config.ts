import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@cards/core", "@cards/db"],
  poweredByHeader: false,
  serverExternalPackages: ["pg", "playwright", "pdfjs-dist", "cheerio"],
  experimental: { cpus: 2 },
  webpack(config) {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};
export default config;
