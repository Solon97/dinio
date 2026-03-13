/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    if (process.env.ROBOTS_NOINDEX !== "true") return [];
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/checkup", destination: "/diagnostico", permanent: true },
      { source: "/checkup/resultado", destination: "/diagnostico/resultado", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
      },
    ],
  },
  webpack: (config, { webpack, isServer }) => {
    // Ignore MongoDB's optional dependencies to prevent build warnings
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(kerberos|@mongodb-js\/zstd|@aws-sdk\/credential-providers|gcp-metadata|snappy|socks|aws4|mongodb-client-encryption)$/,
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;
