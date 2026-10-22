/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@electric-sql/pglite/dist/**/*'],
  },
  images: { unoptimized: true },
  agentRules: false,
  experimental: {
    serverActions: { bodySizeLimit: '8mb' },
  },
};

export default nextConfig;
