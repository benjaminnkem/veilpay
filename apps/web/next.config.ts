import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@repo/types',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
  ],
};

export default nextConfig;
