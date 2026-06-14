'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/Button';
import { filterNormatives, displayJurisdiction, displayStatus } from '@/blocks/normativa/services/normative-service';
import type { NormativeFilters, NormativeJurisdiction, NormativeStatus } from '@/types/normative';
import styles from './NormativaPage.module.css';

const storageKey = 'informe360_selected_normatives';

type JurisdictionFilter = 'all' | NormativeJurisdiction;
type StatusFilter = 'all' | NormativeStatus;

const initialFilters: NormativeFilters = {
  search: '',
  jurisdiction: 'all',
  province: '',
  locality: '',
  topic: '',
  module: '',
  organism: '',
  status: 'all'
};

export function NormativaPage() {
  const [filters, setFilters] = useState<NormativeFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const filtered = useMemo(() => filterNormatives(filters), [filters]);
  const nationalCount = filtered.filter(item => item.jurisdiction === 'nacional').length;
  const territorialCount = filtered.filter(item => item.jurisdiction === 'provincial' || item.jurisdiction === 'municipal').length;
  const sourceReadyCount = filtered.filter(item => item.sourceUrl || item.pdfUrl).length;

  function updateFilter<K extends keyof NormativeFilters>(key: K, value: NormativeFilters[K]) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  function toggleSelected(id: string) {
    setSelectedIds(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}>
        <Link href="/app">← Centro operativo</Link>
        <strong>Biblioteca normativa</strong>
      </nav>

      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Base técnica de referencia</span>
          <h1>Normativa operativa para informes</h1>
          <p>
            Buscá, filtrá y seleccioná normativa relacionada. La aplicación separa alcance nacional,
            provincial y local para evitar sugerencias fuera de jurisdicción.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div><b>{filtered.length}</b><span>resultados</span></div>
          <div><b>{nationalCount}</b><span>nacionales</span></div>
          <div><b>{territorialCount}</b><span>territoriales</span></div>
          <div><b>{selectedIds.length}</b><span>seleccionadas</span></div>
        </div>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <span>Buscar norma, tema u organismo</span>
          <input
            value={filters.search || ''}
            onChange={event => updateFilter('search', event.target.value)}
            placeholder="Ej: EPP, ruido, ambiente, puesta a tierra..."
          />
        </label>
        <div className={styles.filterGrid}>
          <label>
            Jurisdicción
            <select value={filters.jurisdiction || 'all'} onChange={event => updateFilter('jurisdiction', event.target.value as JurisdictionFilter)}>
              <option value="all">Todas</option>
              <option value="nacional">Nacional</option>
              <option value="provincial">Provincial</option>
              <option value="municipal">Municipal</option>
              <option value="referencia">Referencia</option>
            </select>
          </label>
          <label>
            Provincia
            <input value={filters.province || ''} onChange={event => updateFilter('province', event.target.value)} placeholder="Ej: Neuquén" />
          </label>
          <label>
            Localidad
            <input value={filters.locality || ''} onChange={event => updateFilter('locality', event.target.value)} placeholder="Ej: Añelo" />
          </label>
          <label>
            Tema
            <input value={filters.topic || ''} onChange={event => updateFilter('topic', event.target.value)} placeholder="Ej: ruido" />
          </label>
          <label>
            Rubro
            <input value={filters.module || ''} onChange={event => updateFilter('module', event.target.value)} placeholder="Ej: hse" />
          </label>
          <label>
            Estado
            <select value={filters.status || 'all'} onChange={event => updateFilter('status', event.target.value as StatusFilter)}>
              <option value="all">Todos</option>
              <option value="vigente">Vigente</option>
              <option value="referencia">Referencia</option>
              <option value="a_revisar">A revisar</option>
              <option value="derogada">Derogada</option>
            </select>
          </label>
        </div>
        <div className={styles.toolbarFoot}>
          <p>
            Regla territorial: nacional siempre disponible; provincial solo si coincide provincia; municipal solo con provincia y localidad.
          </p>
          <Button variant="secondary" onClick={clearFilters}>Limpiar filtros</Button>
        </div>
      </section>

      <section className={styles.tableShell}>
        <div className={styles.tableHeader}>
          <span>Norma</span>
          <span>Jurisdicción</span>
          <span>Tema</span>
          <span>Estado</span>
          <span>Fuente</span>
          <span>Acciones</span>
        </div>

        <div className={styles.rows}>
          {filtered.map(item => {
            const selected = selectedIds.includes(item.id);
            return (
              <article className={selected ? `${styles.row} ${styles.rowSelected}` : styles.row} key={item.id}>
                <div className={styles.normaCell}>
                  <small>{item.type} · {item.year}</small>
                  <h2>{item.type} {item.number}</h2>
                  <p>{item.title}</p>
                  <em>{item.summary}</em>
                </div>
                <div>
                  <b>{displayJurisdiction(item)}</b>
                  <small>{item.organism}</small>
                </div>
                <div className={styles.topicCell}>
                  {item.topics.slice(0, 3).map(topic => <span key={topic}>{topic}</span>)}
                </div>
                <div>
                  <span className={styles.status}>{displayStatus(item.status)}</span>
                </div>
                <div>
                  <b>{item.officialSourceLabel || 'Fuente pendiente'}</b>
                  <small>{sourceReadyCount ? 'Fuentes parciales cargadas' : 'URLs oficiales pendientes'}</small>
                </div>
                <div className={styles.actions}>
                  {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">Ver online</a> : <button disabled>Ver pendiente</button>}
                  {item.pdfUrl ? <a href={item.pdfUrl} target="_blank" rel="noreferrer">Descargar PDF</a> : <button disabled>PDF pendiente</button>}
                  <button type="button" onClick={() => toggleSelected(item.id)}>{selected ? 'Seleccionada' : 'Usar en informe'}</button>
                </div>
              </article>
            );
          })}
        </div>

        {!filtered.length ? (
          <div className={styles.emptyState}>
            <h3>Sin resultados</h3>
            <p>Probá limpiar filtros o buscar por número, tema, rubro u organismo.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
