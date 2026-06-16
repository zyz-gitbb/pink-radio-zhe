import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Music Radio',
    short_name: 'Radio',
    description: '个人专属的高级手账风音乐电台',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F1E6',
    theme_color: '#F5F1E6',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
