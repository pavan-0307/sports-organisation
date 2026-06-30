import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ['@sportnest/ui', '@sportnest/config', '@sportnest/types', '@sportnest/utils'],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui': resolve(__dirname, '../..', 'packages/ui/src'),
      '@config': resolve(__dirname, '../..', 'packages/config/src'),
      '@types': resolve(__dirname, '../..', 'packages/types/src'),
      '@utils': resolve(__dirname, '../..', 'packages/utils/src'),
    };
    return config;
  },
};

export default nextConfig;
