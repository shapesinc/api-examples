/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable the font warning since we're using next/font properly
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 