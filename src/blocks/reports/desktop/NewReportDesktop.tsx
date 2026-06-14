import Link from 'next/link';
import { ReportForm } from '../shared/ReportForm';
import styles from './NewReportDesktop.module.css';

export function NewReportDesktop() {
  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}><Link href="/app">← Centro operativo</Link><strong>Nuevo informe</strong></nav>
      <header className={styles.header}>
        <span>Flujo guiado de campo</span>
        <h1>Crear informe técnico</h1>
        <p>Cargá la visita, adjuntá evidencia, elegí estilo y generá una versión profesional para revisar, exportar y dar seguimiento.</p>
        <div className={styles.pills}><b>Evidencia</b><b>Acciones SMART</b><b>Normativa relacionada</b><b>PDF</b></div>
      </header>
      <ReportForm />
    </main>
  );
}
