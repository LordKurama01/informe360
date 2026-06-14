import type { ReportInput } from '@/types/report';

export function buildInputAgentPrompt(input: ReportInput) {
  const uploadedFiles = formatUploadedFiles(input);
  return `Ordená esta información de campo sin inventar datos. Empresa: ${input.companyName}. Observaciones: ${input.fieldNotes}. Audio: ${input.audioTranscript || 'sin audio'}. Fotos: ${input.photoNotes || 'sin fotos'}. Archivos cargados: ${uploadedFiles}.`;
}

function formatUploadedFiles(input: ReportInput) {
  const files = input.uploadedFiles || [];
  if (!files.length) return 'sin archivos cargados';

  return files.map(file => {
    const uses = [
      file.useInReport ? 'usar en informe' : '',
      file.useAsAnnex ? 'anexo' : '',
      file.useAsStyleReference ? 'referencia de estilo' : ''
    ].filter(Boolean).join(', ') || 'sin uso marcado';

    return `${file.name} (${file.category}, ${file.extension}, ${uses}, ${file.description || 'sin descripción'})`;
  }).join(' | ');
}
