import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Informe360 HSE Copilot',
  description: 'Herramienta HSE mobile-first para capturar hallazgos, gestionar acciones, inspecciones, evidencias y seguimiento operativo.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
