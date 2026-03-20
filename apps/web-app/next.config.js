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
      { source: "/diagnostico/fb/economia-financas-investimentos", destination: "/diagnostico?utm_source=facebook&utm_medium=group&utm_content=economia-financas-investimentos", permanent: false },
      { source: "/diagnostico/fb/economia-domestica", destination: "/diagnostico?utm_source=facebook&utm_medium=group&utm_content=economia-domestica", permanent: false },
      { source: "/diagnostico/fb/financas-pessoais-futuro", destination: "/diagnostico?utm_source=facebook&utm_medium=group&utm_content=financas-pessoais-futuro", permanent: false },
      { source: "/diagnostico/fb/educacao-financeira", destination: "/diagnostico?utm_source=facebook&utm_medium=group&utm_content=educacao-financeira", permanent: false },
      { source: "/diagnostico/ig/bio", destination: "/diagnostico?utm_source=instagram&utm_medium=social&utm_content=bio", permanent: false },
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
