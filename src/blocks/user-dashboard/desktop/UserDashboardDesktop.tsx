import Link from 'next/link';
import { ButtonLink } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import styles from './UserDashboardDesktop.module.css';

const todayItems = [
  ['1', 'informe para revisar'],
  ['2', 'acciones por vencer'],
  ['1', 'PDF listo para entregar']
];

const metrics = [
  { label: 'Informes este mes', value: '3', hint: '2 finalizados · 1 en revisión' },
  { label: 'Acciones abiertas', value: '5', hint: '2 prioridad alta' },
  { label: 'Horas ahorradas', value: '9,5 h', hint: 'estimado por informes generados' },
  { label: 'Plan actual', value: 'Fundador', hint: 'acceso completo activo' }
];

const workflow = ['Cargar visita', 'Subir evidencia', 'Elegir estilo', 'Generar informe', 'Revisar PDF', 'Agendar seguimiento'];

const actions = [
  ['Alta', 'Registrar evidencia final de mejoras ejecutadas', 'Responsable HSE', 'Vence en 7 días'],
  ['Media', 'Verificar señalización preventiva en zona de circulación', 'Supervisor operativo', 'Vence en 14 días'],
  ['Alta', 'Adjuntar registro fotográfico de cierre', 'Técnico de campo', 'Pendiente de evidencia']
];

const reports = [
  ['PDF listo', 'Mejoras y mantenimiento de unidad', '25 de Mayo S.A.', '3 evidencias · 2 acciones · seguimiento sugerido'],
  ['En revisión', 'Inspección HSE', 'Base operativa Junín', '2 hallazgos · 1 acción alta · normativa relacionada'],
  ['Programado', 'Seguimiento de acciones correctivas', 'Planta Norte', 'reinspección · responsable asignado']
];

const dueItems = [
  ['Hoy', 'Enviar resumen técnico al cliente', 'PDF listo para revisión'],
  ['7 días', 'Control de evidencia de cierre', 'Acción SMART alta'],
  ['30 días', 'Reinspección sugerida', 'Seguimiento posterior']
];

export function UserDashboardDesktop() {
  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}>
        <Link href="/">Informe360</Link>
        <div>
          <Link href="/app/reports">Informes</Link>
          <Link href="/app/actions">Acciones</Link>
          <Link href="/app/calendar">Calendario</Link>
          <Link href="/app/normativa">Normativa</Link>
        </div>
      </nav>

      <section className={styles.topGrid}>
        <Card className={styles.heroCard}>
          <span className={styles.eyebrow}>Centro operativo</span>
          <h1>Centro operativo técnico</h1>
          <p>Una vista de trabajo para informes, evidencia, acciones, vencimientos y entregas. Menos tablero vacío, más ejecución diaria.</p>
          <div className={styles.heroActions}>
            <ButtonLink href="/app/reports/new">Nuevo informe</ButtonLink>
            <ButtonLink href="/app/reports/new" variant="secondary">Crear con modelo</ButtonLink>
          </div>
        </Card>

        <Card className={styles.todayCard}>
          <div className={styles.cardHead}>
            <span className={styles.eyebrow}>Hoy</span>
            <ButtonLink href="/app/calendar" variant="ghost">Agenda</ButtonLink>
          </div>
          <h2>Qué necesita atención</h2>
          <div className={styles.todayList}>
            {todayItems.map(([value, label]) => (
              <div key={label}><b>{value}</b><span>{label}</span></div>
            ))}
          </div>
        </Card>
      </section>

      <section className={styles.metrics}>
        {metrics.map(item => (
          <Card key={item.label} className={styles.metric}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.hint}</small>
          </Card>
        ))}
      </section>

      <section className={styles.workGrid}>
        <Card className={styles.continueCard}>
          <span className={styles.eyebrow}>Continuar trabajo</span>
          <h2>Informe de mantenimiento de unidad</h2>
          <p>En revisión técnica. Falta validar PDF final, confirmar evidencia y dejar seguimiento preventivo.</p>
          <div className={styles.nextBox}>
            <b>Próxima acción</b>
            <span>Registrar evidencia final · vence en 7 días</span>
          </div>
          <div className={styles.cardActions}>
            <ButtonLink href="/app/reports/new">Continuar</ButtonLink>
            <ButtonLink href="/app/calendar" variant="secondary">Ver seguimiento</ButtonLink>
          </div>
        </Card>

        <Card className={styles.flowCard}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.eyebrow}>Flujo principal</span>
              <h3>De visita a entrega profesional</h3>
            </div>
            <ButtonLink href="/app/reports/new" variant="secondary">Iniciar</ButtonLink>
          </div>
          <div className={styles.workflow}>
            {workflow.map((step, index) => (
              <div key={step}><b>{index + 1}</b><span>{step}</span></div>
            ))}
          </div>
        </Card>

        <Card className={styles.deliveryCard}>
          <span className={styles.eyebrow}>PDF y entrega</span>
          <h3>Último PDF generado</h3>
          <p>Mejoras y mantenimiento de unidad · listo para revisión y entrega al cliente.</p>
          <div className={styles.deliveryPills}><span>PDF</span><span>WhatsApp</span><span>Email</span></div>
          <ButtonLink href="/app/reports" variant="secondary">Ver informes</ButtonLink>
        </Card>
      </section>

      <section className={styles.operationsGrid}>
        <Card className={styles.actionsPanel}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.eyebrow}>Acciones abiertas</span>
              <h3>Prioridad, responsable y vencimiento</h3>
            </div>
            <ButtonLink href="/app/actions" variant="secondary">Ver todas</ButtonLink>
          </div>
          <div className={styles.actionList}>
            {actions.map(([priority, title, owner, due]) => (
              <div className={styles.actionRow} key={title}>
                <span className={priority === 'Alta' ? styles.high : styles.medium}>{priority}</span>
                <b>{title}</b>
                <small>{owner}</small>
                <strong>{due}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.duePanel}>
          <span className={styles.eyebrow}>Próximos vencimientos</span>
          <h3>Agenda operativa</h3>
          <div className={styles.dueList}>
            {dueItems.map(([date, title, note]) => (
              <div key={title}><b>{date}</b><span>{title}</span><small>{note}</small></div>
            ))}
          </div>
          <ButtonLink href="/app/calendar" variant="secondary" full>Ver calendario</ButtonLink>
        </Card>
      </section>

      <section className={styles.reportsSection}>
        <div className={styles.cardHead}>
          <div>
            <span className={styles.eyebrow}>Informes recientes</span>
            <h3>Listos para revisar y seguir</h3>
          </div>
          <ButtonLink href="/app/reports" variant="secondary">Historial completo</ButtonLink>
        </div>
        <div className={styles.reportsGrid}>
          {reports.map(([status, title, company, meta]) => (
            <Card key={title} className={styles.reportCard}>
              <span>{status}</span>
              <h4>{title}</h4>
              <p>{company}</p>
              <small>{meta}</small>
              <div className={styles.cardActions}>
                <ButtonLink href="/app/reports/new" variant="secondary">Crear similar</ButtonLink>
                <ButtonLink href="/app/reports" variant="secondary">Historial</ButtonLink>
                <ButtonLink href="/app/actions" variant="ghost">Acciones</ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
