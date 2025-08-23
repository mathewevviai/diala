/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'p16-pu-sign-useast8.tiktokcdn-us.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn-us.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn-eu.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn-no.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign-*.tiktokcdn-us.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign-*.tiktokcdn-eu.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign-*.tiktokcdn-no.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-pu-sign-*.tiktokcdn-us.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-pu-sign-*.tiktokcdn-eu.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-pu-sign-*.tiktokcdn-no.com',
      },
      {
        protocol: 'https',
        hostname: 'p19-sign-*.tiktokcdn-us.com',
      },
      {
        protocol: 'https',
        hostname: 'p19-sign-*.tiktokcdn-eu.com',
      },
      {
        protocol: 'https',
        hostname: 'p19-sign-*.tiktokcdn-no.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
      },
      {
        protocol: 'https',
        hostname: 'clips-media-assets2.twitch.tv',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
}

export default nextConfig