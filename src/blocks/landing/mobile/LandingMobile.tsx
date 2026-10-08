'use client';

import Image from 'next/image';
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
          <Image src="/brand/informe360-hse/mark-light.png" alt="" width={38} height={38} className={styles.logoImage} priority />
          <span className={styles.brandText}><strong>Informe360</strong><small>HSE Copilot</small></span>
        </Link>
        <Link href="/login" className={styles.loginButton}>Ingresar</Link>
      </header>

      <section className={styles.hero}>
        <span className={styles.kicker}>HSE para campo</span>
        <h1>Inspecciones y evidencia, sin doble carga.</h1>
        <p>
          Registrás la recorrida desde el teléfono. Informe360 ordena evidencia, hallazgos, acciones y el informe final en el mismo flujo.
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
          <small>Inspección cerrada</small>
          <h2>Recorrida HSE · Área operativa</h2>
          <p>Hallazgos, evidencia, responsables y cierre técnico.</p>
        </article>
        <div className={styles.miniGrid}>
          <article>
            <small>Evidencia</small>
            <strong>3 evidencias</strong>
            <span>Registro trazable</span>
          </article>
          <article>
            <small>Acciones</small>
            <strong>2 SMART</strong>
            <span>Responsable y vencimiento</span>
          </article>
        </div>
        <article className={styles.delivery}>
          <small>Entrega</small>
          <strong>PDF profesional + historial operativo</strong>
        </article>
      </section>

      <section id="resultado" className={styles.section}>
        <span className={styles.kicker}>Resultado</span>
        <h2>Del campo al cierre.</h2>
        <div className={styles.listCards}>
          <article><strong>Informe editable</strong><span>Hallazgos listos para revisar y entregar.</span></article>
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
