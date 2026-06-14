import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Informe360 AI Agent',
  description: 'Informes profesionales con Gemini, normativa relacionada, acciones SMART, PDF y seguimiento.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
