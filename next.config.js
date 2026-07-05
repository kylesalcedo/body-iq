/** @type {import('next').NextConfig} */

// Static-export mode (GitHub Pages demo) is opt-in via env so normal
// dev/build/Postgres workflows are untouched. See wiki/concepts/static-demo.md.
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  ...(isStatic ? { output: "export" } : {}),
  basePath: isStatic ? basePath : "",
  assetPrefix: isStatic ? basePath : "",
  trailingSlash: isStatic, // GitHub Pages serves /route/ → /route/index.html
  images: { unoptimized: true },
  env: {
    // Read by client code to prefix raw asset URLs and to toggle the
    // no-backend demo behaviour (e.g. hide live search).
    NEXT_PUBLIC_BASE_PATH: isStatic ? basePath : "",
    NEXT_PUBLIC_STATIC: isStatic ? "1" : "",
  },
};

module.exports = nextConfig;
