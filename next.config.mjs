/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['cesium'],
  async rewrites() {
    if (!process.env.BACKEND_URL) return [];
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
