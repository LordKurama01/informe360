import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import styles from './DemoCasePage.module.css';

export function DemoCasePage() {
  return (
    <main className={styles.wrap}>
      <nav><Link href="/">← Landing</Link><strong>Ejemplo guiado</strong></nav>
      <h1>Ejemplo guiado: inspección en base operativa.</h1>
      <div className={styles.grid}>
        <Card><h3>Input</h3><p>Observación de campo con fotos, audio transcripto y desvío operativo.</p></Card>
        <Card><h3>Gemini</h3><p>Genera informe, hallazgos, riesgo, SMART y normativa relacionada.</p></Card>
        <Card><h3>Seguimiento</h3><p>Crea acción pendiente y reinspección a 90 días.</p></Card>
      </div>
      <Link href="/app/reports/new"><Button>Probar flujo real</Button></Link>
    </main>
  );
}
