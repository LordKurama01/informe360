import { redirect } from 'next/navigation';
import LegacyReportsPage from './LegacyReports';

export default function ReportsPage() {
  // Preserve legacy reports for other Informe360 surfaces;
  // the dedicated HSE WEB uses real data and a single navigation shell.
  if (process.env.HSE_WEB_QA_MODE === '1') redirect('/app/hse/reports');
  return <LegacyReportsPage />;
}
