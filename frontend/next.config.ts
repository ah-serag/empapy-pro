import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  } ,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', 
      },
    ],
  },

};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
