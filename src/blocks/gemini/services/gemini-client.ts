const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiCallResult {
  provider: 'gemini' | 'mock';
  rawText: string;
  model: string;
  startedAt: string;
  finishedAt: string;
  latencyMs: number;
}

export async function callGemini(prompt: string): Promise<GeminiCallResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    const rawText = JSON.stringify(mockGeminiResponse(prompt), null, 2);
    return { provider: 'mock', rawText, model: 'mock-no-key', startedAt, finishedAt: new Date().toISOString(), latencyMs: Date.now() - started };
  }

  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.22, responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${message}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return { provider: 'gemini', rawText, model, startedAt, finishedAt: new Date().toISOString(), latencyMs: Date.now() - started };
}

export async function callGeminiText(prompt: string, agentName = 'Informe360 Agent'): Promise<GeminiCallResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    const rawText = `${agentName}: ejecución local preparada. El agente queda listo para operar con Gemini cuando se configure GEMINI_API_KEY.`;
    return { provider: 'mock', rawText, model: 'mock-no-key', startedAt, finishedAt: new Date().toISOString(), latencyMs: Date.now() - started };
  }

  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.18 }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${message}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { provider: 'gemini', rawText, model, startedAt, finishedAt: new Date().toISOString(), latencyMs: Date.now() - started };
}

function mockGeminiResponse(prompt: string) {
  const isTechnicalHunt = /cacería técnica|caceria tecnica|recorrido de hallazgos/i.test(prompt);
  const isMaintenance = !isTechnicalHunt && /mantenimiento|mejoras|unidad|mangueras|hidráulicas/i.test(prompt);
  const title = isMaintenance
    ? 'Informe de mejoras y mantenimiento de unidad'
    : isTechnicalHunt
      ? 'Cacería técnica / recorrido de hallazgos'
      : 'Informe técnico de inspección HSE';
  const generalDescription = isMaintenance
    ? 'Durante la intervención realizada sobre la unidad, se ejecutaron distintas tareas de mejora, mantenimiento preventivo y adecuación de condiciones de seguridad operativa. Las acciones efectuadas estuvieron orientadas a reforzar la confiabilidad del equipo, proteger componentes críticos y mejorar las condiciones generales de operación.'
    : isTechnicalHunt
      ? 'Durante el recorrido técnico realizado, se relevaron sectores, condiciones observadas, hallazgos, desvíos, riesgos y oportunidades de mejora asociados al tema definido para la cacería. El presente informe organiza la evidencia disponible, prioriza acciones y deja planteado un esquema de seguimiento para verificar el cierre.'
    : 'Durante la visita técnica realizada en el sitio indicado, se relevaron condiciones operativas, observaciones de campo, evidencias disponibles y desvíos que requieren tratamiento documentado. El presente informe organiza los hallazgos detectados, propone acciones correctivas y deja planteado un esquema de seguimiento para verificar su cierre efectivo.';

  return {
    title,
    executiveSummary: isMaintenance
      ? 'Se realizaron mejoras preventivas y tareas de mantenimiento sobre la unidad, incluyendo protección de componentes hidráulicos y eléctricos, incorporación de elementos de seguridad y control general del equipo. Finalizada la intervención, la unidad quedó disponible para uso operativo bajo condiciones adecuadas.'
      : isTechnicalHunt
        ? 'Se realizó una cacería técnica como recorrido guiado de hallazgos. La información relevada fue organizada por condición observada, evidencia, riesgo u oportunidad de mejora, con acciones SMART y seguimiento sugerido para validar el cierre.'
      : 'Se identificaron condiciones de trabajo que requieren ordenamiento, corrección y seguimiento. La información relevada fue estructurada en hallazgos técnicos, acciones SMART, referencias normativas para revisión profesional y calendario sugerido de verificación.',
    generalDescription,
    technicalDetails: isMaintenance ? [
      {
        title: 'Instalación de protector de batería',
        description: 'Se instaló un protector de batería de acrílico transparente, permitiendo la visualización directa y permanente del estado del componente.',
        objective: 'Facilitar controles visuales preventivos y detectar en forma temprana posibles anomalías.',
        benefit: 'Mejora la seguridad operativa y reduce la posibilidad de fallas no detectadas.',
        evidence: 'Registro fotográfico del protector instalado.'
      },
      {
        title: 'Protección de mangueras hidráulicas',
        description: 'Se realizó el recubrimiento de mangueras hidráulicas mediante espiralado protector y se reemplazaron preventivamente mangueras ubicadas en sectores internos de la pluma telescópica.',
        objective: 'Aumentar la protección frente a rozamientos, impactos, desgaste prematuro y contaminación del sistema.',
        benefit: 'Incrementa la confiabilidad del circuito hidráulico y prolonga la vida útil de componentes críticos.',
        evidence: 'Imágenes del espiralado protector y mangueras reemplazadas.'
      },
      {
        title: 'Adecuación eléctrica y elementos de seguridad',
        description: 'Se efectuó el aislamiento de la instalación eléctrica y se instaló un matafuegos en la parte posterior del equipo.',
        objective: 'Reducir riesgos asociados a humedad, contacto indebido, cortocircuitos y principios de incendio.',
        benefit: 'Mejora la respuesta ante emergencias y fortalece condiciones de seguridad operativa.',
        evidence: 'Registro visual de aislación eléctrica y ubicación del matafuegos.'
      }
    ] : isTechnicalHunt ? [
      {
        title: 'Recorrido guiado de hallazgos',
        description: 'Se realizó un recorrido técnico orientado a identificar condiciones observables, desvíos, riesgos y oportunidades de mejora sobre el tema definido por el profesional responsable.',
        objective: 'Ordenar la búsqueda de hallazgos y transformar observaciones dispersas en criterios de seguimiento verificables.',
        benefit: 'Mejora la trazabilidad del relevamiento y facilita priorizar acciones según riesgo, urgencia e impacto operativo.',
        evidence: 'Registros fotográficos, notas de campo, checklist o documentación adjunta al recorrido.'
      },
      {
        title: 'Priorización de condiciones detectadas',
        description: 'Los hallazgos se agrupan según condición observada, sector, responsable sugerido, evidencia disponible y necesidad de cierre documentado.',
        objective: 'Evitar que el recorrido quede como una lista suelta y convertirlo en un plan de acción verificable.',
        benefit: 'Permite comunicar resultados con claridad y sostener seguimiento posterior hasta el cierre efectivo.',
        evidence: 'Descripción de sectores visitados, evidencia adjunta y registros de verificación.'
      }
    ] : [
      {
        title: 'Ordenamiento de zona de circulación',
        description: 'Se observó material acopiado en una zona de circulación, generando interferencias para el tránsito seguro del personal.',
        objective: 'Restablecer condiciones de orden, limpieza y circulación segura.',
        benefit: 'Reduce probabilidad de tropiezos, obstrucciones y exposición a condiciones inseguras.',
        evidence: 'Registro fotográfico del sector observado y evidencia posterior de corrección.'
      },
      {
        title: 'Señalización preventiva insuficiente',
        description: 'Se identificó ausencia o insuficiencia de señalización preventiva en el área observada.',
        objective: 'Advertir condiciones temporales de riesgo y orientar la circulación segura.',
        benefit: 'Mejora la comunicación visual del riesgo y disminuye exposición del personal.',
        evidence: 'Fotografía del área antes/después de la colocación de señalización.'
      }
    ],
    findings: isMaintenance
      ? ['Mejoras preventivas ejecutadas sobre componentes hidráulicos, eléctricos y elementos de seguridad.', 'Unidad verificada luego de la intervención.', 'Se recomienda mantener registro fotográfico y controles periódicos.']
      : isTechnicalHunt
        ? ['Recorrido técnico realizado con foco en búsqueda de hallazgos.', 'Condiciones observadas ordenadas para revisión profesional.', 'Se recomienda priorizar cierre con evidencia según criticidad y responsable.']
      : ['Material acopiado fuera de lugar en zona de circulación.', 'Señalización preventiva insuficiente.', 'Registro de cierre pendiente para validar corrección efectiva.'],
    riskLevel: isMaintenance ? 'bajo' : 'medio',
    probableCauses: isMaintenance
      ? ['Mantenimiento preventivo programado', 'Adecuación de componentes críticos', 'Necesidad de reforzar protección operativa']
      : isTechnicalHunt
        ? ['Recorrido preventivo programado', 'Necesidad de detectar desvíos antes de incidentes', 'Oportunidades de mejora identificadas en campo']
      : ['Control previo insuficiente', 'Comunicación operativa dispersa', 'Seguimiento documental pendiente'],
    smartActions: [
      { action: isMaintenance ? 'Registrar evidencia final de las mejoras ejecutadas y archivar documentación de respaldo.' : isTechnicalHunt ? 'Clasificar hallazgos del recorrido por prioridad, responsable sugerido y evidencia requerida para cierre.' : 'Liberar zona de circulación, retirar material acopiado y registrar evidencia fotográfica de corrección.', responsible: 'Responsable HSE / Supervisor operativo', dueInDays: 7, evidence: 'Fotografías de cierre y registro firmado', priority: 'alta', sourceFinding: 'Condición observada en campo' },
      { action: isMaintenance ? 'Incorporar la unidad al control preventivo periódico de componentes hidráulicos y eléctricos.' : isTechnicalHunt ? 'Programar verificación de cierre de los hallazgos priorizados y registrar evidencia antes/después.' : 'Realizar charla breve de refuerzo sobre orden, limpieza y señalización preventiva.', responsible: 'Supervisor de turno', dueInDays: 14, evidence: 'Registro de verificación, fotos de cierre o acta interna', priority: 'media', sourceFinding: 'Necesidad de seguimiento operativo' }
    ],
    relatedNormatives: ['Ley 19.587 - Higiene y Seguridad en el Trabajo', 'Decreto 351/79 - Condiciones de higiene y seguridad', 'Resolución SRT 299/2011 - Elementos de protección personal', 'ISO 45001 - Sistemas de gestión de seguridad y salud en el trabajo'],
    calendarSuggestions: [
      { title: isMaintenance ? 'Control preventivo posterior de unidad' : isTechnicalHunt ? 'Verificación de cierre de cacería técnica' : 'Reinspección de acciones correctivas HSE', reason: 'Verificar cierre efectivo de acciones y registro de evidencia', dueInDays: 30, reminderDaysBefore: 5, linkedAction: 'Seguimiento de acciones del informe' }
    ],
    finalStatus: isMaintenance
      ? ['Unidad 100% operativa.', 'Condiciones adecuadas para su uso.', 'Componentes hidráulicos y eléctricos con protección reforzada.', 'Elementos de seguridad incorporados y verificados.']
      : isTechnicalHunt
        ? ['Recorrido técnico documentado.', 'Hallazgos ordenados para revisión y priorización.', 'Acciones de seguimiento sugeridas.', 'Evidencia pendiente de completar según corresponda.']
      : ['Acciones correctivas definidas.', 'Seguimiento requerido hasta cierre documentado.', 'Normativa relacionada incluida para revisión profesional.', 'Reinspección sugerida para validar eficacia.'],
    attachmentsSummary: 'Se recomienda adjuntar imágenes de la intervención, registros de control, fotografías de antes/después y toda documentación respaldatoria vinculada al informe.',
    clientSummary: isMaintenance
      ? 'Se realizaron mejoras preventivas y adecuaciones de seguridad sobre la unidad. El equipo fue verificado y queda disponible para uso operativo, con documentación respaldatoria adjunta.'
      : isTechnicalHunt
        ? 'Se realizó un recorrido técnico de hallazgos, se organizaron las condiciones observadas y se definieron acciones de seguimiento con evidencia requerida para cierre.'
      : 'Se realizó una inspección técnica, se identificaron hallazgos y se definieron acciones correctivas con seguimiento. Se adjunta informe para revisión y cierre de tareas.',
    conclusion: isMaintenance
      ? 'Las tareas ejecutadas permitieron mejorar las condiciones generales de seguridad, mantenimiento y confiabilidad operativa de la unidad. Conforme a la verificación realizada, el equipo queda disponible para su uso operativo, manteniendo el seguimiento preventivo correspondiente.'
      : isTechnicalHunt
        ? 'La cacería técnica permitió ordenar observaciones de campo en hallazgos accionables. Se recomienda validar prioridades, completar evidencia de cierre y sostener seguimiento documentado hasta verificar la corrección efectiva.'
      : 'Las condiciones observadas requieren corrección, documentación de cierre y seguimiento posterior. Se recomienda implementar las acciones definidas, adjuntar evidencia y validar el cumplimiento final con el profesional responsable.',
    impactMetrics: { estimatedManualTimeMinutes: 180, estimatedAiTimeMinutes: 45, estimatedTimeSavedMinutes: 135, estimatedTimeSavedPercent: 75 },
    qualityScore: { score: 88, structure: 'Completa', actions: 'SMART generadas', evidence: 'Evidencia solicitada', conclusion: 'Conclusión técnica incluida' },
    decisionTrail: [
      { type: 'input', agentName: 'Input Agent', inputUsed: 'Observaciones, checklist, fotos y estilo de referencia', recommendation: 'Ordenar la información en un caso técnico único.', reasoning: 'La información de campo llega dispersa y debe estructurarse antes de redactar.', output: 'Caso técnico organizado por secciones.' },
      { type: 'technical', agentName: 'Technical Agent', inputUsed: 'Hallazgos y contexto operativo', recommendation: 'Transformar observaciones en detalle técnico desarrollado.', reasoning: 'El informe debe explicar objetivo, beneficio y evidencia, no solo listar hechos.', output: 'Detalle técnico redactado.' },
      { type: 'normative', agentName: 'Normative Agent', inputUsed: 'Tipo de informe, provincia y actividad', recommendation: 'Incluir normativa relacionada para revisión profesional.', reasoning: 'La normativa orienta el análisis, pero la validación final corresponde al responsable técnico.', output: 'Marco normativo relacionado.' },
      { type: 'smart', agentName: 'SMART Action Agent', inputUsed: 'Hallazgos y riesgos', recommendation: 'Crear acciones con responsable, fecha, prioridad y evidencia de cierre.', reasoning: 'Sin responsables y vencimientos el informe no genera seguimiento operativo.', output: 'Acciones SMART generadas.' },
      { type: 'calendar', agentName: 'Calendar Agent', inputUsed: 'Acciones y necesidad de control posterior', recommendation: 'Proponer reinspección o control preventivo.', reasoning: 'El cierre debe verificarse con calendario y evidencia.', output: 'Seguimiento sugerido.' },
      { type: 'executive', agentName: 'Executive Summary Agent', inputUsed: 'Informe completo', recommendation: 'Preparar resumen ejecutivo para cliente o gerencia.', reasoning: 'La decisión requiere una síntesis clara y accionable.', output: 'Resumen ejecutivo y resumen para cliente.' }
    ]
  };
}
