import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { ButtonLink } from '@/shared/components/Button';
import styles from './CalendarPage.module.css';

const events = [
  ['Hoy', 'Enviar resumen técnico al cliente', 'Informe de mantenimiento'],
  ['7 días', 'Verificar evidencia de cierre', 'Acción SMART alta'],
  ['30 días', 'Control preventivo posterior', 'Reinspección sugerida']
];

export function CalendarPage() {
  return (
    <main className={styles.wrap}>
      <nav><Link href="/app">← Centro operativo</Link><strong>Calendario</strong></nav>
      <header><span>Seguimiento</span><h1>Visitas, vencimientos y reinspecciones</h1><p>El seguimiento convierte el informe en trabajo vivo: fechas, responsables, recordatorios y verificación de cierre.</p></header>
      <section className={styles.grid}>
        <Card className={styles.calendar}><h3>Próximos eventos</h3>{events.map(([date, title, note]) => <div key={title}><b>{date}</b><span>{title}</span><small>{note}</small></div>)}</Card>
        <Card><span className={styles.gold}>Agenda operativa</span><h3>Seguimiento preparado</h3><p>Los vencimientos quedan asociados a informes y acciones. La exportación a calendarios externos se incorporará en la etapa de entrega.</p><ButtonLink href="/app/actions" variant="secondary">Ver acciones</ButtonLink></Card>
        <Card><span className={styles.gold}>Retención</span><h3>Por qué vuelve</h3><p>Acciones abiertas, vencimientos, reinspecciones y clientes cargados mantienen el flujo activo.</p></Card>
      </section>
    </main>
  );
}
