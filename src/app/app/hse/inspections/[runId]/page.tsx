import { HseControl } from '@/blocks/hse-control/HseControl';

export default async function HseInspectionRunPage({
  params,
}: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <HseControl mode="inspection-run" inspectionRunId={runId} />;
}
