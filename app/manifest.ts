import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SIMantu Kejaksaan',
    short_name: 'SIMantu',
    description: 'Sistem Monitoring Pencairan Tukin & Uang Makan',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon.jpg',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.jpg',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}