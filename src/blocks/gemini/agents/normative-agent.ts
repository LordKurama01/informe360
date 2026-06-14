import type { ReportInput } from '@/types/report';
import { displayJurisdiction, displayStatus, getApplicableNormatives } from '@/blocks/normativa/services/normative-service';
import type { NormativeItem } from '@/types/normative';

export function buildNormativeAgentPrompt(input: ReportInput) {
  const availableNormatives = getApplicableNormatives({
    province: input.province,
    locality: input.locationAddress
  });

  const normatives = availableNormatives.length
    ? availableNormatives.map(item => `- ${formatNormativeReference(item)}. Jurisdicción: ${displayJurisdiction(item)}. Temas: ${item.topics.join(', ')}. Estado: ${displayStatus(item.status)}.`).join('\n')
    : '- No hay normativa cargada aplicable con el contexto territorial informado.';

  return `Sugerí normativa relacionada para revisión profesional según el caso, sin emitir dictamen legal y sin inventar normas no cargadas.

Reglas obligatorias:
- Usá solo la base normativa disponible abajo.
- Normativa nacional: puede aplicarse siempre.
- Normativa provincial: solo si coincide con la provincia del informe.
- Normativa municipal/local: solo si coincide con provincia y localidad.
- Si falta provincia o localidad, no fuerces normativa territorial.
- No mezcles jurisdicciones: no sugieras normativa de otra provincia o municipio.
- Presentá la normativa como relacionada para revisión profesional, no como cumplimiento legal definitivo.

Contexto del informe:
Empresa: ${input.companyName || 'no informada'}
Lugar/base: ${input.siteName || 'no informado'}
Provincia: ${input.province || 'no informada'}
Ubicación/localidad: ${input.locationAddress || 'no informada'}
Tipo de informe: ${input.reportType || 'no informado'}
Caso: ${input.fieldNotes || 'sin observaciones'}

Base normativa aplicable cargada:
${normatives}`;
}

function formatNormativeReference(item: NormativeItem) {
  return `${item.type} ${item.number} - ${item.title}`;
}
