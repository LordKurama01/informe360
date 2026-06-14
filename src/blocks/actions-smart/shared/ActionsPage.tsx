import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { ButtonLink } from '@/shared/components/Button';
import styles from './ActionsPage.module.css';

const actions = [
  ['Registrar evidencia final de las mejoras ejecutadas', 'Responsable HSE', 'Alta', '7 días', 'Pendiente'],
  ['Programar control preventivo de componentes hidráulicos y eléctricos', 'Supervisor operativo', 'Media', '30 días', 'En progreso'],
  ['Enviar resumen técnico al cliente', 'Técnico responsable', 'Media', 'Hoy', 'Pendiente'],
  ['Archivar documentación respaldatoria', 'Administración técnica', 'Baja', '15 días', 'Pendiente']
];

export function ActionsPage() {
  return (
    <main className={styles.wrap}>
      <nav><Link href="/app">← Centro operativo</Link><strong>Acciones SMART</strong></nav>
      <header><span>Seguimiento operativo</span><h1>Acciones, responsables y vencimientos</h1><p>Cada informe genera tareas cerrables, con prioridad, responsable, evidencia y fecha sugerida.</p></header>
      <section className={styles.metrics}><Card><b>8</b><span>Pendientes</span></Card><Card><b>3</b><span>Vencen pronto</span></Card><Card><b>5</b><span>Con evidencia solicitada</span></Card></section>
      <section className={styles.list}>{actions.map(([name, owner, priority, due, status]) => <Card key={name} className={styles.action}><div><b>{priority}</b><span>{status}</span></div><h3>{name}</h3><p>Responsable: {owner}</p><p>Vence: {due} · Evidencia requerida para cierre.</p></Card>)}</section>
      <ButtonLink href="/app/calendar">Ver calendario</ButtonLink>
    </main>
  );
}
