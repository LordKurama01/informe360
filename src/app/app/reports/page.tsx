'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ButtonLink } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import styles from './reports.module.css';

const reports = [
  {
    status: 'PDF listo',
    title: 'Mejoras y mantenimiento de unidad',
    company: '25 de Mayo S.A.',
    date: 'Hoy',
    meta: '3 evidencias · 2 acciones · seguimiento sugerido',
    tone: 'ready'
  },
  {
    status: 'En revisión',
    title: 'Inspección HSE',
    company: 'Base operativa Junín',
    date: 'Esta semana',
    meta: '2 hallazgos · 1 acción alta · normativa relacionada',
    tone: 'review'
  },
  {
    status: 'Programado',
    title: 'Seguimiento de acciones correctivas',
    company: 'Planta Norte',
    date: '30 días',
    meta: 'reinspección · responsable asignado',
    tone: 'scheduled'
  }
];

const stats = [
  ['3', 'informes este mes'],
  ['1', 'PDF listo'],
  ['5', 'acciones abiertas'],
  ['9,5 h', 'ahorro estimado']
];

const filters = ['Todos', 'PDF listo', 'En revisión', 'Programado'] as const;
type ReportFilter = typeof filters[number];

export default function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState<ReportFilter>('Todos');
  const visibleReports = useMemo(
    () => activeFilter === 'Todos' ? reports : reports.filter(report => report.status === activeFilter),
    [activeFilter]
  );

  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}>
        <Link href="/app">← Centro operativo</Link>
        <ButtonLink href="/app/reports/new">Nuevo informe</ButtonLink>
      </nav>

      <header className={styles.hero}>
        <div>
          <span>Historial operativo</span>
          <h1>Informes técnicos</h1>
          <p>Revisá trabajos generados, estado de PDF, acciones asociadas y entregas pendientes. Diseñado para volver rápido al informe correcto.</p>
        </div>
        <div className={styles.stats}>
          {stats.map(([value, label]) => <div key={label}><b>{value}</b><small>{label}</small></div>)}
        </div>
      </header>

      <section className={styles.toolbar}>
        <div>
          <b>Vista actual</b>
          <span>{activeFilter === 'Todos' ? 'Todos los informes' : activeFilter} · {visibleReports.length} resultado{visibleReports.length === 1 ? '' : 's'}</span>
        </div>
        <div className={styles.quickFilters}>
          {filters.map(filter => (
            <button
              key={filter}
              type="button"
              className={filter === activeFilter ? styles.filterActive : styles.filterButton}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={filter === activeFilter}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        {visibleReports.map(report => (
          <Card key={report.title} className={styles.reportCard}>
            <div className={styles.cardTop}>
              <span className={`${styles.status} ${styles[report.tone]}`}>{report.status}</span>
              <small>{report.date}</small>
            </div>
            <h2>{report.title}</h2>
            <p>{report.company}</p>
            <small className={styles.meta}>{report.meta}</small>
            <div className={styles.actions}>
              <ButtonLink href="/app/reports/new">Crear similar</ButtonLink>
              <ButtonLink href="/app/actions" variant="secondary">Ver acciones</ButtonLink>
              <ButtonLink href="/app" variant="ghost">Centro operativo</ButtonLink>
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}
