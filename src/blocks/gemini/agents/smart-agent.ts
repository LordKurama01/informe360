export function buildSmartAgentPrompt(findings: string[]) {
  return `Convertí estos hallazgos en acciones SMART con responsable, vencimiento y evidencia requerida. Hallazgos: ${findings.join(' | ')}`;
}
