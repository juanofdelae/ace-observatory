import {
  AlertStatus,
  InstrumentType,
  Phase,
  Sector,
} from "@prisma/client";
import { z } from "zod";

export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  LOI: "LOI · Carta de intención",
  MOU: "MOU · Memorando de entendimiento",
  CONTRACT: "Contrato",
};

export const INSTRUMENT_SHORT: Record<InstrumentType, string> = {
  LOI: "LOI",
  MOU: "MOU",
  CONTRACT: "Contrato",
};

export const PHASE_LABELS: Record<Phase, string> = {
  SIGNED: "Firmado",
  CONTACTED: "Contactado",
  ACTIVE: "Activo",
  RESULT: "Resultado",
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  ACTIVE: "Activo",
  NEEDS_ATTENTION: "Necesita atención",
  CLOSED: "Cerrado",
};

export const SECTOR_LABELS: Record<Sector, string> = {
  INNOVATION: "Innovación",
  SMES: "PyMEs",
  AGRITECH: "Agritech",
  LOGISTICS: "Logística",
  EDTECH: "Edtech",
  TOURISM: "Turismo",
  MANUFACTURING: "Manufactura",
  FINTECH: "Fintech",
  HEALTH: "Salud",
  ENERGY: "Energía",
  CLEAN_ENERGY: "Energía limpia",
  SMART_CITIES: "Ciudades inteligentes",
  CREATIVE_INDUSTRIES: "Industrias creativas",
  ENTREPRENEURIAL_ECOSYSTEM: "Ecosistema emprendedor",
  TRADE: "Comercio",
  OTHER: "Otro",
};

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Shared shape used by both the agreement form (Phase 2 · commit 6) and
 * the server action. Pure types, no Date coercion — the action converts
 * dates before persisting.
 */
export const agreementSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "El código es obligatorio")
      .max(60, "Máximo 60 caracteres"),
    editionId: z.string().min(1, "Selecciona una edición"),
    instrumentType: z.enum(InstrumentType, { message: "Selecciona un tipo" }),
    signedDate: z.string().regex(isoDateRegex, "Fecha inválida"),
    partyAId: z.string().min(1, "Selecciona una institución"),
    signerAId: z.string().min(1, "Selecciona un firmante"),
    partyBId: z.string().min(1, "Selecciona una institución"),
    signerBId: z.string().min(1, "Selecciona un firmante"),
    subject: z
      .string()
      .trim()
      .min(10, "Mínimo 10 caracteres")
      .max(2000, "Máximo 2000 caracteres"),
    primarySector: z.enum(Sector, { message: "Selecciona un sector" }),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    phase: z.enum(Phase).default(Phase.SIGNED),
    alertStatus: z.enum(AlertStatus).default(AlertStatus.ACTIVE),
    resultSummary: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    resultDate: z
      .string()
      .regex(isoDateRegex, "Fecha inválida")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((data) => data.partyAId !== data.partyBId, {
    path: ["partyBId"],
    message: "Las dos partes no pueden ser la misma institución",
  })
  .refine(
    (data) =>
      data.phase !== Phase.RESULT || (data.resultSummary && data.resultDate),
    {
      path: ["resultSummary"],
      message: "Para fase RESULT, el resumen y la fecha son obligatorios",
    },
  );

export type AgreementInput = z.infer<typeof agreementSchema>;
