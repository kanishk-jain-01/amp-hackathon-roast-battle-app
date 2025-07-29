/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@roast-battle/ui'],
  images: {
    domains: [],
  },
  env: {
    // Load environment variables from root .env file
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  },
}

module.exports = nextConfig
