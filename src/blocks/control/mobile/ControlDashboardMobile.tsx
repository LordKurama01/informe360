import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { controlSummary } from '../services/mock-control-data';
import styles from './ControlDashboardMobile.module.css';

export function ControlDashboardMobile() {
  return (
    <main className={styles.wrap}>
      <header><strong>Control</strong><Link href="/app">App</Link></header>
      <span>Owner dashboard</span>
      <h1>Control operativo</h1>
      <p>Usuarios, pagos, IA, reportes y evidencia.</p>
      <div className={styles.cards}>
        <Card><b>Ingresos</b><strong>${controlSummary.revenueMonthARS}</strong></Card>
        <Card><b>Fundadores</b><strong>{controlSummary.founderUsers}</strong></Card>
        <Card><b>IA</b><strong>{controlSummary.geminiCalls}</strong></Card>
        <Card><b>PDFs</b><strong>{controlSummary.pdfExports}</strong></Card>
      </div>
    </main>
  );
}
