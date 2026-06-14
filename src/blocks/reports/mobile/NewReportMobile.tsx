import Link from 'next/link';
import { ReportForm } from '../shared/ReportForm';
import styles from './NewReportMobile.module.css';

export function NewReportMobile() {
  return (
    <main className={styles.wrap}>
      <header><Link href="/app">←</Link><strong>Nuevo informe</strong></header>
      <section className={styles.hero}>
        <span>Flujo guiado</span>
        <h1>Crear informe técnico</h1>
        <p>Visita, evidencia, estilo y revisión final en pasos claros.</p>
      </section>
      <ReportForm compact />
    </main>
  );
}
