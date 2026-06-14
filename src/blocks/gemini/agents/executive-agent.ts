export function buildExecutiveAgentPrompt(reportText: string) {
  return `Generá un resumen ejecutivo breve para gerencia/cliente, sin tecnicismos excesivos, a partir de este informe: ${reportText}`;
}
