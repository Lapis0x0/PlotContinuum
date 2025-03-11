/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    // 处理MD编辑器的SSR问题
    config.resolve.fallback = { fs: false };
    return config;
  },
}

module.exports = nextConfig;
