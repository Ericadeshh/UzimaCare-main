/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- This is the critical part to ignore TypeScript errors during the build ---
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // --------------------------------------------------------------------------

  // Empty turbopack config to prevent the warning/error
  turbopack: {},

  // Add webpack fallback to prevent browser build errors for Node-only modules
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      zlib: false,
    };

    // Add path alias for @convex
    config.resolve.alias = {
      ...config.resolve.alias,
      "@convex": path.resolve("./convex"),
    };

    return config;
  },
};

export default nextConfig;
