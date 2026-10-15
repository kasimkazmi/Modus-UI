// Old component slugs (renamed in the Modus restyle) mapped to their current names.
const renamed = require("./component-redirects.json");

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
  async redirects() {
    const slugs = Object.entries(renamed).flatMap(([from, to]) => [
      { source: `/components/${from}`, destination: `/components/${to}`, permanent: true },
      { source: `/components/${from}.md`, destination: `/components/${to}.md`, permanent: true },
      { source: `/preview/${from}`, destination: `/preview/${to}`, permanent: true },
      { source: `/docs/${from}`, destination: `/components/${to}`, permanent: true },
      // The CLI and MCP server fetch component source from here.
      { source: `/registry/${from}.json`, destination: `/registry/${to}.json`, permanent: true },
    ]);
    // The docs moved from /docs to /components.
    return [
      ...slugs,
      { source: "/docs", destination: "/components", permanent: true },
      { source: "/docs/components", destination: "/components", permanent: true },
      { source: "/docs/:slug", destination: "/components/:slug", permanent: true },
    ];
  },
  async rewrites() {
    // Markdown docs for coding agents: /components/<name>.md is served by src/app/md/[name]/route.ts.
    return [{ source: "/components/:name.md", destination: "/md/:name" }];
  },
};

module.exports = nextConfig;
