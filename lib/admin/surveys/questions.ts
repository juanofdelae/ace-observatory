import { SurveyMilestone } from "@prisma/client";

export type SurveyQuestion = {
  id: string;
  prompt: string;
  /** Allowed answer kinds — front-end picks the right input. */
  kind: "scale_1_5" | "yes_no" | "text";
};

export const SURVEY_QUESTIONS: Record<SurveyMilestone, SurveyQuestion[]> = {
  DAY_30: [
    { id: "first_contact", prompt: "¿Ya hubo un primer contacto entre las partes?", kind: "yes_no" },
    { id: "joint_plan", prompt: "¿Existe un plan inicial o calendario conjunto?", kind: "yes_no" },
    { id: "obstacles", prompt: "Si hay obstáculos, descríbelos brevemente.", kind: "text" },
  ],
  DAY_60: [
    { id: "alignment", prompt: "Del 1 al 5, ¿qué tan alineadas siguen las partes con el objetivo del acuerdo?", kind: "scale_1_5" },
    { id: "progress", prompt: "¿Hay avances concretos respecto al día 30?", kind: "yes_no" },
    { id: "summary", prompt: "Describe los avances o, si no los hubo, qué falta destrabar.", kind: "text" },
  ],
  DAY_90: [
    { id: "still_active", prompt: "¿El acuerdo sigue activo?", kind: "yes_no" },
    { id: "needs_support", prompt: "¿Necesitan apoyo del equipo ACE para destrabar algo?", kind: "yes_no" },
    { id: "outcomes", prompt: "Detalla resultados intermedios o entregables logrados.", kind: "text" },
  ],
  MONTH_6: [
    { id: "concrete_results", prompt: "¿Se materializaron entregables, proyectos o intercambios concretos?", kind: "yes_no" },
    { id: "impact_scale", prompt: "Del 1 al 5, ¿cuál es el impacto percibido del acuerdo hasta ahora?", kind: "scale_1_5" },
    { id: "narrative", prompt: "Cuéntanos brevemente el resultado más destacado.", kind: "text" },
  ],
  MONTH_12: [
    { id: "alive", prompt: "¿La alianza sigue produciendo actividad un año después?", kind: "yes_no" },
    { id: "renew", prompt: "¿Está en planes renovar o expandir el acuerdo?", kind: "yes_no" },
    { id: "summary", prompt: "Resumen ejecutivo del año: lo logrado, lo pendiente y los próximos pasos.", kind: "text" },
  ],
};

export const MILESTONE_LABELS: Record<SurveyMilestone, string> = {
  DAY_30: "30 días",
  DAY_60: "60 días",
  DAY_90: "90 días",
  MONTH_6: "6 meses",
  MONTH_12: "12 meses",
};

/** Days after signing when the survey is due to be sent. */
export const MILESTONE_OFFSETS_DAYS: Record<SurveyMilestone, number> = {
  DAY_30: 30,
  DAY_60: 60,
  DAY_90: 90,
  MONTH_6: 180,
  MONTH_12: 365,
};
