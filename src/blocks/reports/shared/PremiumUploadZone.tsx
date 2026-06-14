'use client';

import { ChangeEvent, DragEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import type { ReportUploadedFileCategory, ReportUploadedFileMetadata } from '@/types/report';
import styles from './PremiumUploadZone.module.css';

type FileUseKey = 'useInReport' | 'useAsAnnex' | 'useAsStyleReference';

interface UseOption {
  key: FileUseKey;
  label: string;
}

interface PremiumUploadZoneProps {
  title: string;
  subtitle: string;
  cta: string;
  accept: string;
  category: ReportUploadedFileCategory;
  files: ReportUploadedFileMetadata[];
  useOptions: UseOption[];
  onFilesSelected: (files: FileList | File[], category: ReportUploadedFileCategory) => void;
  onRemoveFile: (id: string) => void;
  onUpdateFile: (id: string, patch: Partial<ReportUploadedFileMetadata>) => void;
}

export function PremiumUploadZone({
  title,
  subtitle,
  cta,
  accept,
  category,
  files,
  useOptions,
  onFilesSelected,
  onRemoveFile,
  onUpdateFile
}: PremiumUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedLabel = useMemo(() => accept.replace(/\./g, '').replace(/,/g, ' · ').toUpperCase(), [accept]);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      onFilesSelected(event.target.files, category);
      event.target.value = '';
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      onFilesSelected(event.dataTransfer.files, category);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  }

  return (
    <section className={styles.zoneShell}>
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
      />

      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className={styles.dropIcon}>{category === 'evidence' ? 'EV' : 'REF'}</div>
        <div>
          <span className={styles.eyebrow}>{title}</span>
          <h4>{cta}</h4>
          <p>{subtitle}</p>
          <small>Formatos admitidos: {acceptedLabel}</small>
        </div>
      </div>

      <div className={styles.mobileChoices}>
        <button type="button" onClick={openPicker}>Tomar foto</button>
        <button type="button" onClick={openPicker}>Galería</button>
        <button type="button" onClick={openPicker}>Documento</button>
      </div>

      {files.length ? (
        <div className={styles.fileGrid}>
          {files.map(file => (
            <article className={styles.fileCard} key={file.id}>
              <div className={styles.fileVisual}>
                {file.previewUrl && file.type.startsWith('image/') ? (
                  <span
                    className={styles.previewImage}
                    role="img"
                    aria-label={file.name}
                    style={{ backgroundImage: `url("${file.previewUrl}")` }}
                  />
                ) : (
                  <span>{iconForFile(file)}</span>
                )}
              </div>

              <div className={styles.fileBody}>
                <div className={styles.fileHead}>
                  <div>
                    <b>{file.name}</b>
                    <small>{file.extension.toUpperCase()} · {formatBytes(file.size)}</small>
                  </div>
                  <button
                    className={styles.remove}
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    aria-label={`Eliminar ${file.name}`}
                  >
                    Eliminar
                  </button>
                </div>

                <label className={styles.description}>
                  Descripción breve
                  <textarea
                    value={file.description || ''}
                    onChange={(event) => onUpdateFile(file.id, { description: event.target.value })}
                    placeholder={category === 'evidence' ? 'Ej: Foto del sector observado antes de corregir.' : 'Ej: Modelo de informe con tono técnico del usuario.'}
                  />
                </label>

                <div className={styles.useRow}>
                  {useOptions.map(option => {
                    const active = Boolean(file[option.key]);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        className={active ? styles.useActive : styles.use}
                        onClick={() => onUpdateFile(file.id, { [option.key]: !active })}
                      >
                        {active ? 'OK ' : ''}{option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyHint}>Todavía no cargaste archivos en esta sección.</p>
      )}
    </section>
  );
}

function iconForFile(file: ReportUploadedFileMetadata) {
  const ext = file.extension.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (['doc', 'docx'].includes(ext)) return 'DOC';
  if (['txt', 'md'].includes(ext)) return 'TXT';
  return 'FILE';
}

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
