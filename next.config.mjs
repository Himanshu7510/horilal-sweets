/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@electric-sql/pglite/dist/**/*'],
  },
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: '8mb' },
  },
};

export default nextConfig;
