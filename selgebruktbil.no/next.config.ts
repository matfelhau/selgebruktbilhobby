// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {  
  trailingSlash: true,
  images: {
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

export default nextConfig