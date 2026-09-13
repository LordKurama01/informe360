import type { Metadata } from 'next';
import './globals.css';

const description = 'Herramienta HSE mobile-first para capturar hallazgos, gestionar acciones, inspecciones, evidencias y seguimiento operativo.';

export const metadata: Metadata = {
  title: 'Informe360 HSE Copilot',
  description,
  icons: {
    icon: [
      { url: '/brand/informe360-hse/favicon.ico' },
      { url: '/brand/informe360-hse/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/brand/informe360-hse/favicon-16.png', type: 'image/png', sizes: '16x16' }
    ],
    apple: '/brand/informe360-hse/apple-touch-icon.png'
  },
  openGraph: {
    title: 'Informe360 HSE Copilot',
    description,
    type: 'website',
    images: [
      {
        url: '/brand/informe360-hse/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Informe360 HSE Copilot'
      }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
