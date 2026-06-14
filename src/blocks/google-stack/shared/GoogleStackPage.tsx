import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { googleIntegrations } from '../config/google-integrations';
import styles from './GoogleStackPage.module.css';

const labels = {
  ready: 'Listo V1',
  configured: 'Configurado',
  needs_env: 'Falta ENV',
  future: 'Preparado futuro'
};

export function GoogleStackPage() {
  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}><Link href="/control">← Control</Link><strong>Google Stack Center</strong></nav>
      <header className={styles.header}>
        <span>Gemini + Google Cloud</span>
        <h1>Integraciones Google para operar, medir y escalar.</h1>
        <p>Estado operativo de integraciones que ayudan a iniciar sesión, generar informes, calendarizar seguimiento y registrar evidencia.</p>
      </header>
      <section className={styles.grid}>
        {googleIntegrations.map(item => (
          <Card key={item.id} className={styles.card}>
            <div className={styles.row}><h3>{item.name}</h3><b className={styles[item.status]}>{labels[item.status]}</b></div>
            <p>{item.purpose}</p>
            <small><b>Evidencia:</b> {item.evidence}</small>
            {item.requiredEnv?.length ? <small><b>ENV:</b> {item.requiredEnv.join(', ')}</small> : null}
          </Card>
        ))}
      </section>
    </main>
  );
}
