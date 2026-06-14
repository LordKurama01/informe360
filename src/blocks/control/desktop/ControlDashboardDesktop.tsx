import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { MetricCard } from '@/shared/components/MetricCard';
import { moneyARS } from '@/shared/utils/format';
import { controlFunnel, controlSummary } from '../services/mock-control-data';
import styles from './ControlDashboardDesktop.module.css';

const evidence = [
  ['Evidencia comercial', 'Usuarios pagos, ingresos, comprobantes, planes activos y conversión.'],
  ['Trazabilidad de IA', 'Entradas, agentes ejecutados, recomendaciones, acciones generadas y ediciones del usuario.'],
  ['Métricas de impacto', 'Tiempo estimado antes/después, PDFs exportados, acciones creadas y eventos calendarizados.'],
  ['Seguimiento de uso', 'Informes por usuario, actividad reciente, feedback, retención y alertas operativas.']
];

export function ControlDashboardDesktop() {
  return (
    <main className={styles.wrap}>
      <aside className={styles.side}>
        <strong>Informe360 Control</strong>
        <Link href="/control">Resumen</Link><a>Usuarios</a><a>Pagos</a><a>Informes</a><a>IA Logs</a><Link href="/control/decision-trail">Trazabilidad IA</Link><Link href="/control/google">Google Stack</Link><Link href="/control/xprize">Evidencia interna</Link><Link href="/app">App usuario</Link>
      </aside>
      <section className={styles.main}>
        <header className={styles.header}><span>Owner dashboard</span><h1>Control operativo Informe360</h1><p>Usuarios, pagos, uso, IA, reportes y evidencia en un solo lugar.</p></header>
        <div className={styles.metrics}>
          <MetricCard label="Ingresos mes" value={moneyARS(controlSummary.revenueMonthARS)} hint="pagos registrados" />
          <MetricCard label="Fundadores pagos" value={String(controlSummary.founderUsers)} hint="$30.000/mes" />
          <MetricCard label="Llamadas IA" value={String(controlSummary.geminiCalls)} hint="trazabilidad" />
          <MetricCard label="PDFs" value={String(controlSummary.pdfExports)} hint="exportados" />
          <MetricCard label="Acciones SMART" value={String(controlSummary.smartActionsCreated)} hint="creadas" />
          <MetricCard label="Calendario" value={String(controlSummary.calendarEventsCreated)} hint="seguimientos" />
          <MetricCard label="Ahorro" value={controlSummary.averageTimeSavedPercent} hint="promedio" />
          <MetricCard label="Testimonios" value={String(controlSummary.testimonials)} hint="autorizados" />
        </div>
        <div className={styles.grid}>
          <Card><h3>Embudo comercial</h3>{controlFunnel.map(([k,v]) => <p key={k}><b>{k}:</b> {v}</p>)}</Card>
          {evidence.map(([title, body]) => <Card key={title}><h3>{title}</h3><p>{body}</p></Card>)}
          <Card><h3>Integraciones Google</h3><p>Gemini, Auth, Calendar, Maps, Cloud Run, Cloud Storage, Logging y Gmail API preparados por bloque.</p><Link href="/control/google">Ver integraciones →</Link></Card>
          <Card><h3>Alertas operativas</h3><p>Al activar la base de datos, el sistema detecta pagos vencidos, usuarios inactivos, acciones sin cerrar y clientes sin feedback.</p></Card>
        </div>
      </section>
    </main>
  );
}
