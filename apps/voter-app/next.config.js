/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@roast-battle/ui'],
  images: {
    domains: [],
  },
  env: {
    // Load environment variables from root .env file
    MAIN_APP_URL: process.env.MAIN_APP_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
