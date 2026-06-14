import styles from './MetricCard.module.css';

export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
