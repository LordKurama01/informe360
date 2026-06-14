import type { GeneratedReport } from '@/types/report';
import { buildReportHtml } from '../templates/report-html';

export function openPrintableReport(report: GeneratedReport) {
  const html = buildReportHtml(report);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.print();
}
