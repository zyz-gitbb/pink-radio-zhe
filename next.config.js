const withSerwist = require("@serwist/next").default({
  // 注意：在开发环境下一般禁用 PWA 缓存避免调试麻烦，如果要调试设为 false
  disable: process.env.NODE_ENV === "development",
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "p1.music.126.net",
      },
      {
        protocol: "https",
        hostname: "p2.music.126.net",
      },
    ],
  },
  turbopack: {},
};

module.exports = withSerwist(nextConfig);
