import Link from 'next/link';
import { ButtonLink } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import styles from './UserDashboardMobile.module.css';

const today = [['1', 'informe para revisar'], ['2', 'acciones por vencer'], ['1', 'PDF listo']];
const actions = [['Alta', 'Registrar evidencia final', 'Vence en 7 días'], ['Media', 'Verificar señalización', 'Vence en 14 días'], ['Alta', 'Adjuntar fotos de cierre', 'Pendiente']];
const reports = [['PDF listo', 'Mejoras y mantenimiento de unidad', '25 de Mayo S.A.'], ['En revisión', 'Inspección HSE', 'Base operativa Junín'], ['Programado', 'Seguimiento de acciones', 'Planta Norte']];

export function UserDashboardMobile() {
  return (
    <main className={styles.wrap}>
      <header className={styles.topbar}>
        <Link href="/">Informe360</Link>
        <Link href="/app/reports">Informes</Link>
      </header>

      <section className={styles.hero}>
        <span>Centro operativo</span>
        <h1>Centro operativo técnico</h1>
        <p>Informes, acciones, evidencia y vencimientos en una vista simple.</p>
        <div className={styles.heroActions}>
          <ButtonLink href="/app/reports/new" full>Nuevo informe</ButtonLink>
          <ButtonLink href="/app/reports/new" variant="secondary" full>Crear con modelo</ButtonLink>
        </div>
      </section>

      <section className={styles.todayGrid}>
        {today.map(([value, label]) => <Card key={label} className={styles.todayItem}><b>{value}</b><span>{label}</span></Card>)}
      </section>

      <Card className={styles.continueCard}>
        <span>Continuar trabajo</span>
        <h2>Informe de mantenimiento de unidad</h2>
        <p>Falta revisar PDF final y confirmar seguimiento preventivo.</p>
        <div className={styles.nextAction}><b>Próxima acción</b><small>Registrar evidencia final · vence en 7 días</small></div>
        <ButtonLink href="/app/reports/new" full>Continuar</ButtonLink>
      </Card>

      <Card className={styles.flowCard}>
        <span>Flujo principal</span>
        <h3>De visita a informe listo</h3>
        <div className={styles.flow}><b>Cargar visita</b><b>Subir evidencia</b><b>Elegir estilo</b><b>Generar informe</b><b>Agendar seguimiento</b></div>
      </Card>

      <section className={styles.stack}>
        <Card>
          <span className={styles.eyebrow}>Acciones abiertas</span>
          <div className={styles.actionList}>
            {actions.map(([priority, title, due]) => <div key={title}><strong>{priority}</strong><b>{title}</b><small>{due}</small></div>)}
          </div>
          <ButtonLink href="/app/actions" variant="secondary" full>Ver acciones</ButtonLink>
        </Card>

        <Card>
          <span className={styles.eyebrow}>PDF y entrega</span>
          <h3>Último informe listo</h3>
          <p>Preparado para revisar, descargar y compartir cuando cerremos entrega.</p>
          <div className={styles.delivery}><span>PDF</span><span>WhatsApp</span><span>Email</span></div>
          <ButtonLink href="/app/reports" variant="secondary" full>Ver informes</ButtonLink>
        </Card>
      </section>

      <section className={styles.reports}>
        <div className={styles.sectionTitle}><span>Informes recientes</span><Link href="/app/reports">Ver todos</Link></div>
        {reports.map(([status, title, company]) => (
          <Card key={title} className={styles.reportCard}>
            <small>{status}</small>
            <h3>{title}</h3>
            <p>{company}</p>
            <div><ButtonLink href="/app/reports/new" variant="secondary">Crear similar</ButtonLink><ButtonLink href="/app/reports" variant="ghost">Historial</ButtonLink></div>
          </Card>
        ))}
      </section>
    </main>
  );
}
