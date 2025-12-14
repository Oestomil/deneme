/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    // Fix workspace root for monorepo
    outputFileTracingRoot: path.join(__dirname, '../../'),
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.public.blob.vercel-storage.com',
            },
        ],
    },
}

module.exports = nextConfig
