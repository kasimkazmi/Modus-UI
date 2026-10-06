/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media1.giphy.com",
      },
    ],
  },
  async rewrites() {
    // Markdown docs for coding agents: /docs/<name>.md is served by src/app/md/[name]/route.ts.
    return [{ source: "/docs/:name.md", destination: "/md/:name" }];
  },
};

module.exports = nextConfig;
