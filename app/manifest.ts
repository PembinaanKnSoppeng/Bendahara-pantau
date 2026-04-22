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
        src: '/icon-192x192.png', // <-- Harus mengarah ke file PNG
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png', // <-- Harus mengarah ke file PNG
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}