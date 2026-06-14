'use client';

import Link from 'next/link';
import styles from './LandingDesktop.module.css';

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

export function LandingDesktop() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Informe360 inicio">
          <span className={styles.logo}>360</span>
          <strong>Informe360</strong>
        </Link>

        <nav className={styles.nav} aria-label="Navegacion principal">
          <a href="#resultado">Resultado</a>
          <a href="#flujo">Como funciona</a>
          <a href="#planes">Planes</a>
        </nav>

        <Link href="/login" className={styles.loginButton}>Ingresar</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Informes tecnicos para campo</span>
          <h1>Informes t&eacute;cnicos listos para entregar.</h1>
          <p className={styles.lead}>
            Cargas la visita, subis evidencia y completas el checklist. Informe360 arma un informe editable con acciones SMART, normativa relacionada, PDF profesional y seguimiento.
          </p>

          <div id="planes" className={styles.planBox}>
            <div className={styles.planHeader}>
              <span>Plan Profesional</span>
              <strong>Sin setup pesado</strong>
            </div>

            <div className={styles.prices}>
              <div>
                <small>Mensual</small>
                <b>$39.999 ARS</b>
                <span>/ mes</span>
              </div>
              <div className={styles.annualDeal}>
                <small>Anual</small>
                <b>$350.000 ARS</b>
                <span>/ a&ntilde;o</span>
              </div>
            </div>

            <p>Incluye informes tecnicos, evidencia, checklist HSE, acciones SMART, normativa relacionada, PDF profesional y soporte inicial por WhatsApp.</p>

            <a className={styles.contractButton} href={contractHref} target="_blank" rel="noreferrer" onClick={trackContract}>
              Contratar
            </a>
          </div>
        </div>

        <aside className={styles.mockup} aria-label="Resultado final de Informe360">
          <div className={styles.mockupTop}>
            <span>Resultado final</span>
            <strong>Informe360</strong>
          </div>

          <section className={styles.reportPreview}>
            <small>Informe generado</small>
            <h2>Mejoras y mantenimiento de unidad</h2>
            <p>Resumen ejecutivo, hallazgos, detalle tecnico y conclusion.</p>
          </section>

          <div className={styles.outputGrid}>
            <section>
              <small>Evidencia</small>
              <strong>3 fotos</strong>
              <span>Checklist HSE</span>
            </section>
            <section>
              <small>Acciones</small>
              <strong>2 SMART</strong>
              <span>Responsable y vencimiento</span>
            </section>
          </div>

          <section className={styles.deliveryBox}>
            <small>Entrega</small>
            <strong>PDF listo + resumen para compartir</strong>
          </section>
        </aside>
      </section>

      <section id="resultado" className={styles.resultSection}>
        <div className={styles.sectionIntro}>
          <span className={styles.kicker}>Resultado</span>
          <h2>Menos armado manual. Mas entrega profesional.</h2>
        </div>

        <div className={styles.benefits}>
          <article>
            <h3>Informe editable</h3>
            <p>Texto tecnico listo para revisar, corregir y entregar.</p>
          </article>
          <article>
            <h3>PDF profesional</h3>
            <p>Salida preparada para descargar y enviar al cliente.</p>
          </article>
          <article>
            <h3>Acciones SMART</h3>
            <p>Responsable, prioridad, vencimiento y evidencia de cierre.</p>
          </article>
          <article>
            <h3>Seguimiento</h3>
            <p>Pendientes y proximos pasos despues de cada visita.</p>
          </article>
        </div>
      </section>

      <section id="flujo" className={styles.flowSection}>
        <div className={styles.sectionIntro}>
          <span className={styles.kicker}>Como funciona</span>
          <h2>Tres pasos. Sin sistema pesado.</h2>
        </div>

        <div className={styles.steps}>
          <article>
            <span>01</span>
            <h3>Cargas la visita</h3>
            <p>Empresa, lugar, fecha, sector y observaciones.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Subis evidencia</h3>
            <p>Fotos, documentos, checklist y notas tecnicas.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Revisas y entregas</h3>
            <p>Informe editable, PDF profesional y acciones de seguimiento.</p>
          </article>
        </div>
      </section>

      <footer className={styles.footer}>
        <strong>Informe360</strong>
        <span>Informes tecnicos, PDF profesional y seguimiento operativo.</span>
        <Link href="/login">Ingresar</Link>
      </footer>
    </main>
  );
}
