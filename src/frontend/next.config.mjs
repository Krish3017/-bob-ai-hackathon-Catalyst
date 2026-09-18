/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
