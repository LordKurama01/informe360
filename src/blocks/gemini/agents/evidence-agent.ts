export function buildEvidenceAgentPrompt(eventName: string, metadata: Record<string, unknown>) {
  return `Clasificá este evento como evidencia interna útil o no útil. Evento: ${eventName}. Metadata: ${JSON.stringify(metadata)}`;
}
