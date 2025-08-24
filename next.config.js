/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to focus on functionality first
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Be less strict about TypeScript errors during build
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
