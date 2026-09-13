'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/shared/components/Card';
import { Button, ButtonLink } from '@/shared/components/Button';
import {
  createHseReminder,
  getHseReminders,
  getHseWorkspace,
  updateHseReminderStatus,
  type HseReminder,
  type HseWorkspace,
} from '@/services/hse/browser';
import styles from './CalendarPage.module.css';

const formatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function reminderState(reminder: HseReminder) {
  if (reminder.status === 'completed') return { label: 'Hecho', tone: 'done' };
  if (reminder.status === 'cancelled') return { label: 'Cancelado', tone: 'muted' };
  if (reminder.status === 'sent') return { label: 'Aviso enviado', tone: 'sent' };
  if (reminder.status === 'failed') return { label: 'Error de envío', tone: 'danger' };
  return { label: 'Pendiente', tone: 'pending' };
}

function channelLabel(channel: HseReminder['channel']) {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'push') return 'Push';
  if (channel === 'email') return 'Email';
  return 'Informe360';
}

export function CalendarPage() {
  const [workspace, setWorkspace] = useState<HseWorkspace | null>(null);
  const [reminders, setReminders] = useState<HseReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');

  const load = useCallback(async () => {
    try {
      const nextWorkspace = await getHseWorkspace();
      setWorkspace(nextWorkspace);
      if (!nextWorkspace) {
        setReminders([]);
        return;
      }
      setReminders(await getHseReminders(nextWorkspace));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la agenda HSE.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pending = useMemo(
    () => reminders.filter(reminder => reminder.status === 'pending'),
    [reminders],
  );
  const history = useMemo(
    () => reminders.filter(reminder => reminder.status !== 'pending').slice(-30).reverse(),
    [reminders],
  );
  const whatsapp = useMemo(
    () => reminders.filter(reminder => reminder.channel === 'whatsapp').length,
    [reminders],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !scheduledFor) return;
    setSaving(true);
    setError('');
    try {
      await createHseReminder(workspace, { title, notes, scheduledFor });
      setTitle('');
      setNotes('');
      setScheduledFor('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el recordatorio.');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(reminderId: string, status: 'completed' | 'cancelled') {
    setError('');
    try {
      await updateHseReminderStatus(reminderId, status);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el recordatorio.');
    }
  }

  function refresh() {
    setLoading(true);
    setError('');
    void load();
  }

  return (
    <main className={styles.wrap}>
      <nav><Link href="/app/hse">← HSE Copilot</Link><strong>Agenda HSE</strong></nav>

      <header>
        <span>Seguimiento operativo</span>
        <h1>Recordatorios que viven en el mismo HSE Copilot.</h1>
        <p>Lo que se agenda desde WhatsApp o Informe360 aparece acá. Google Calendar será una sincronización opcional; Informe360 sigue siendo la fuente de verdad.</p>
      </header>

      {error ? <div className={styles.error} role="alert">{error}</div> : null}

      {loading ? (
        <Card className={styles.stateCard}><strong>Cargando agenda…</strong><p>Estamos leyendo los recordatorios reales de tu organización.</p></Card>
      ) : !workspace ? (
        <Card className={styles.stateCard}>
          <strong>Necesitás una sesión HSE activa.</strong>
          <p>Ingresá con un usuario asociado a una organización para ver y crear recordatorios.</p>
          <ButtonLink href="/login">Ingresar</ButtonLink>
        </Card>
      ) : (
        <>
          <section className={styles.metrics} aria-label="Resumen de agenda">
            <Card><span>Pendientes</span><strong>{pending.length}</strong><small>{workspace.siteName || workspace.organizationName}</small></Card>
            <Card><span>Total agenda</span><strong>{reminders.length}</strong><small>recordatorios visibles</small></Card>
            <Card><span>Desde WhatsApp</span><strong>{whatsapp}</strong><small>misma agenda, otro canal</small></Card>
          </section>

          <section className={styles.grid}>
            <Card className={styles.calendar}>
              <div className={styles.sectionHeading}>
                <div><span className={styles.eyebrow}>Próximos</span><h3>Agenda operativa</h3></div>
                <button type="button" className={styles.refresh} onClick={refresh}>Actualizar</button>
              </div>

              {pending.length === 0 ? (
                <div className={styles.empty}><strong>No hay recordatorios pendientes.</strong><small>Podés crear uno acá o simplemente pedírselo a HSE Copilot por WhatsApp.</small></div>
              ) : pending.map(reminder => {
                const state = reminderState(reminder);
                return (
                  <article className={styles.event} key={reminder.id}>
                    <div className={styles.date}>{formatter.format(new Date(reminder.scheduled_for))}</div>
                    <div className={styles.eventBody}>
                      <div className={styles.eventTop}>
                        <strong>{reminder.title || 'Seguimiento HSE'}</strong>
                        <span className={`${styles.badge} ${styles[state.tone]}`}>{state.label}</span>
                      </div>
                      {reminder.notes ? <p>{reminder.notes}</p> : null}
                      <small>{channelLabel(reminder.channel)}{reminder.finding_id ? ' · vinculado a hallazgo' : ''}</small>
                      <div className={styles.actions}>
                        <Button type="button" variant="secondary" onClick={() => void setStatus(reminder.id, 'completed')}>Marcar hecho</Button>
                        <Button type="button" variant="ghost" onClick={() => void setStatus(reminder.id, 'cancelled')}>Cancelar</Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </Card>

            <div className={styles.side}>
              <Card>
                <span className={styles.eyebrow}>Nuevo recordatorio</span>
                <h3>Agendar seguimiento</h3>
                <form className={styles.form} onSubmit={handleCreate}>
                  <label>Título<input value={title} onChange={event => setTitle(event.target.value)} placeholder="Ej. Revisar amoladora" required /></label>
                  <label>Fecha y hora<input type="datetime-local" value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} required /></label>
                  <label>Nota<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Contexto opcional" rows={3} /></label>
                  <Button type="submit" disabled={saving || !scheduledFor}>{saving ? 'Guardando…' : 'Crear recordatorio'}</Button>
                </form>
              </Card>

              <Card>
                <span className={styles.eyebrow}>Historial</span>
                <h3>Últimos movimientos</h3>
                <div className={styles.history}>
                  {history.length === 0 ? <p>Todavía no hay recordatorios finalizados.</p> : history.slice(0, 8).map(reminder => {
                    const state = reminderState(reminder);
                    return <div key={reminder.id}><strong>{reminder.title || 'Seguimiento HSE'}</strong><small>{formatter.format(new Date(reminder.scheduled_for))} · {state.label}</small></div>;
                  })}
                </div>
              </Card>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
