'use client';

import Link from 'next/link';
import styles from './LandingMobile.module.css';

const contractHref = `https://wa.me/?text=${encodeURIComponent(
  'Hola, quiero contratar Informe360 Plan Profesional.'
)}`;

function trackContract() {
  void fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'contract_click', path: '/' })
  }).catch(() => undefined);
}

export function LandingMobile() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Informe360 inicio">
          <span>360</span>
          <strong>Informe360</strong>
        </Link>
        <Link href="/login" className={styles.loginButton}>Ingresar</Link>
      </header>

      <section className={styles.hero}>
        <span className={styles.kicker}>Informes para campo</span>
        <h1>Informes t&eacute;cnicos listos para entregar.</h1>
        <p>
          Cargas visita, evidencia y checklist. Informe360 arma informe editable, acciones SMART, normativa relacionada, PDF profesional y seguimiento.
        </p>

        <section className={styles.planCard} aria-label="Plan Profesional">
          <div className={styles.planTop}>
            <span>Plan Profesional</span>
            <small>Uso desde celular</small>
          </div>
          <div className={styles.priceGrid}>
            <div>
              <small>Mensual</small>
              <strong>$39.999</strong>
              <span>ARS / mes</span>
            </div>
            <div className={styles.annual}>
              <small>Anual</small>
              <strong>$350.000</strong>
              <span>ARS / a&ntilde;o</span>
            </div>
          </div>
          <a className={styles.contractButton} href={contractHref} target="_blank" rel="noreferrer" onClick={trackContract}>
            Contratar
          </a>
        </section>

        <div className={styles.chips}>
          <span>Sin instalaci&oacute;n pesada</span>
          <span>PDF profesional</span>
          <span>Soporte inicial</span>
        </div>
      </section>

      <section className={styles.mockup} aria-label="Resultado final de Informe360">
        <div className={styles.mockHeader}>
          <span>Resultado final</span>
          <strong>Informe360</strong>
        </div>
        <article className={styles.reportBlock}>
          <small>Informe generado</small>
          <h2>Mejoras y mantenimiento de unidad</h2>
          <p>Resumen, hallazgos, detalle tecnico y conclusion.</p>
        </article>
        <div className={styles.miniGrid}>
          <article>
            <small>Evidencia</small>
            <strong>3 fotos</strong>
            <span>Checklist HSE</span>
          </article>
          <article>
            <small>Acciones</small>
            <strong>2 SMART</strong>
            <span>Responsable y vencimiento</span>
          </article>
        </div>
        <article className={styles.delivery}>
          <small>Entrega</small>
          <strong>PDF listo + resumen para compartir</strong>
        </article>
      </section>

      <section id="resultado" className={styles.section}>
        <span className={styles.kicker}>Resultado</span>
        <h2>Menos armado manual.</h2>
        <div className={styles.listCards}>
          <article><strong>Informe editable</strong><span>Texto listo para revisar y entregar.</span></article>
          <article><strong>PDF profesional</strong><span>Salida preparada para descargar y enviar.</span></article>
          <article><strong>Acciones SMART</strong><span>Responsable, prioridad y vencimiento.</span></article>
          <article><strong>Seguimiento</strong><span>Pendientes despues de cada visita.</span></article>
        </div>
      </section>

      <section id="flujo" className={styles.section}>
        <span className={styles.kicker}>Como funciona</span>
        <h2>Tres pasos.</h2>
        <div className={styles.steps}>
          <article><b>01</b><strong>Cargas visita</strong><span>Empresa, fecha, sector y observaciones.</span></article>
          <article><b>02</b><strong>Subis evidencia</strong><span>Fotos, documentos y checklist.</span></article>
          <article><b>03</b><strong>Revisas y entregas</strong><span>Informe editable, PDF y acciones.</span></article>
        </div>
      </section>

      <footer className={styles.footer}>
        <strong>Informe360</strong>
        <Link href="/login">Ingresar</Link>
      </footer>
    </main>
  );
}
