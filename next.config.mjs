/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/admin/statuses", destination: "/admin/categories", permanent: true }];
  },
};

export default nextConfig;
