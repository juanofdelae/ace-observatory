import {
  AlertStatus,
  InstrumentType,
  Phase,
  Sector,
} from "@prisma/client";

export type AgreementView = "all" | "needs-attention" | "active" | "result" | "closed";

export const VIEW_OPTIONS: ReadonlyArray<{ value: AgreementView; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "needs-attention", label: "Necesitan atención" },
  { value: "active", label: "Activos" },
  { value: "result", label: "Con resultado" },
  { value: "closed", label: "Cerrados" },
];

export type DocumentFilter = "yes" | "no";

export type AgreementFilters = {
  view: AgreementView;
  search: string;
  editionId: string | null;
  phase: Phase | null;
  alertStatus: AlertStatus | null;
  sector: Sector | null;
  instrumentType: InstrumentType | null;
  countryId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  hasDocument: DocumentFilter | null;
};

export const EMPTY_FILTERS: AgreementFilters = {
  view: "all",
  search: "",
  editionId: null,
  phase: null,
  alertStatus: null,
  sector: null,
  instrumentType: null,
  countryId: null,
  dateFrom: null,
  dateTo: null,
  hasDocument: null,
};

function strParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

function enumParam<T extends string>(
  value: string | string[] | undefined,
  allowed: ReadonlyArray<T>,
): T | null {
  const s = strParam(value);
  if (!s) return null;
  return allowed.includes(s as T) ? (s as T) : null;
}

const VIEW_VALUES: ReadonlyArray<AgreementView> = VIEW_OPTIONS.map((v) => v.value);

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): AgreementFilters {
  return {
    view: enumParam<AgreementView>(searchParams.view, VIEW_VALUES) ?? "all",
    search: strParam(searchParams.search) ?? "",
    editionId: strParam(searchParams.edition),
    phase: enumParam<Phase>(
      searchParams.phase,
      Object.values(Phase) as Phase[],
    ),
    alertStatus: enumParam<AlertStatus>(
      searchParams.alert,
      Object.values(AlertStatus) as AlertStatus[],
    ),
    sector: enumParam<Sector>(
      searchParams.sector,
      Object.values(Sector) as Sector[],
    ),
    instrumentType: enumParam<InstrumentType>(
      searchParams.instrument,
      Object.values(InstrumentType) as InstrumentType[],
    ),
    countryId: strParam(searchParams.country),
    dateFrom: strParam(searchParams.from),
    dateTo: strParam(searchParams.to),
    hasDocument: enumParam<DocumentFilter>(searchParams.doc, ["yes", "no"]),
  };
}

// Build a URLSearchParams string from a filters object. Empty / null values
// are dropped so URLs stay clean. The `view=all` default also drops because
// it adds no information.
export function serializeFilters(filters: Partial<AgreementFilters>): string {
  const params = new URLSearchParams();
  if (filters.view && filters.view !== "all") params.set("view", filters.view);
  if (filters.search) params.set("search", filters.search);
  if (filters.editionId) params.set("edition", filters.editionId);
  if (filters.phase) params.set("phase", filters.phase);
  if (filters.alertStatus) params.set("alert", filters.alertStatus);
  if (filters.sector) params.set("sector", filters.sector);
  if (filters.instrumentType) params.set("instrument", filters.instrumentType);
  if (filters.countryId) params.set("country", filters.countryId);
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (filters.hasDocument) params.set("doc", filters.hasDocument);
  return params.toString();
}

// True iff any non-view, non-search filter is active. Used to show the
// "Limpiar filtros" affordance only when there's something to clear.
export function hasActiveFilters(filters: AgreementFilters): boolean {
  return (
    filters.editionId !== null ||
    filters.phase !== null ||
    filters.alertStatus !== null ||
    filters.sector !== null ||
    filters.instrumentType !== null ||
    filters.countryId !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.hasDocument !== null
  );
}
