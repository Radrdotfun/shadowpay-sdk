/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shadowpay/client', '@shadowpay/server', '@shadowpay/core'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        'pino-pretty': false,
      }
    }
    return config
  },
}

module.exports = nextConfig

