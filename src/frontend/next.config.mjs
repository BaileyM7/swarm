/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/geo-layers',
    '@deck.gl/react',
    '@deck.gl/extensions',
    '@luma.gl/core',
    '@luma.gl/webgl',
    '@math.gl/core',
  ],
  webpack: (config) => {
    // Deck.gl requires 'fs' shim to be disabled in browser builds
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
