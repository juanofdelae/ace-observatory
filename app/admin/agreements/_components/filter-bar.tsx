"use client";

import {
  AlertStatus,
  InstrumentType,
  Phase,
  Sector,
} from "@prisma/client";
import { usePathname, useRouter } from "next/navigation";

import {
  type AgreementFilters,
  type DocumentFilter,
  hasActiveFilters,
  serializeFilters,
} from "@/lib/admin/agreements/url-state";
import {
  ALERT_STATUS_LABELS,
  INSTRUMENT_SHORT,
  PHASE_LABELS,
  SECTOR_LABELS,
} from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

type EditionOption = { id: string; name: string; year: number };
type CountryOption = { id: string; name: string };

export function FilterBar({
  filters,
  editions,
  countries,
}: {
  filters: AgreementFilters;
  editions: EditionOption[];
  countries: CountryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  function pushFilters(next: AgreementFilters) {
    const qs = serializeFilters(next);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function update<K extends keyof AgreementFilters>(
    key: K,
    value: AgreementFilters[K] | null,
  ) {
    pushFilters({ ...filters, [key]: value });
  }

  function clearAll() {
    pushFilters({
      ...filters,
      editionId: null,
      phase: null,
      alertStatus: null,
      sector: null,
      instrumentType: null,
      countryId: null,
      dateFrom: null,
      dateTo: null,
      hasDocument: null,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <FilterSelect
        label="Edición"
        value={filters.editionId}
        onChange={(v) => update("editionId", v)}
        options={editions.map((e) => ({ value: e.id, label: e.name }))}
      />
      <FilterSelect
        label="Fase"
        value={filters.phase}
        onChange={(v) => update("phase", (v as Phase | null) ?? null)}
        options={(Object.entries(PHASE_LABELS) as Array<[Phase, string]>).map(
          ([v, l]) => ({ value: v, label: l }),
        )}
      />
      <FilterSelect
        label="Alerta"
        value={filters.alertStatus}
        onChange={(v) => update("alertStatus", (v as AlertStatus | null) ?? null)}
        options={(Object.entries(ALERT_STATUS_LABELS) as Array<[AlertStatus, string]>).map(
          ([v, l]) => ({ value: v, label: l }),
        )}
      />
      <FilterSelect
        label="Sector"
        value={filters.sector}
        onChange={(v) => update("sector", (v as Sector | null) ?? null)}
        options={(Object.entries(SECTOR_LABELS) as Array<[Sector, string]>).map(
          ([v, l]) => ({ value: v, label: l }),
        )}
      />
      <FilterSelect
        label="Instrumento"
        value={filters.instrumentType}
        onChange={(v) =>
          update("instrumentType", (v as InstrumentType | null) ?? null)
        }
        options={(Object.entries(INSTRUMENT_SHORT) as Array<[InstrumentType, string]>).map(
          ([v, l]) => ({ value: v, label: l }),
        )}
      />
      <FilterSelect
        label="País"
        value={filters.countryId}
        onChange={(v) => update("countryId", v)}
        options={countries.map((c) => ({ value: c.id, label: c.name }))}
      />
      <FilterSelect
        label="Documento"
        value={filters.hasDocument}
        onChange={(v) => update("hasDocument", (v as DocumentFilter | null) ?? null)}
        options={[
          { value: "yes", label: "Con documento" },
          { value: "no", label: "Sin documento" },
        ]}
      />
      <DateRangeFilter filters={filters} onUpdate={update} />
      {hasActiveFilters(filters) ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-text-muted hover:text-text ml-1 text-[12px] underline-offset-2 hover:underline"
        >
          Limpiar
        </button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | null) => void;
}) {
  const active = value !== null;
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      aria-label={label}
      className={cn(
        "border-border bg-surface text-text h-8 rounded-md border px-2 text-[12px] focus:border-primary focus:outline-none",
        active && "border-primary bg-primary/5 font-medium",
      )}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function DateRangeFilter({
  filters,
  onUpdate,
}: {
  filters: AgreementFilters;
  onUpdate: <K extends keyof AgreementFilters>(
    key: K,
    value: AgreementFilters[K] | null,
  ) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => onUpdate("dateFrom", e.target.value || null)}
        className={cn(
          "border-border bg-surface text-text h-8 rounded-md border px-2 text-[12px] focus:border-primary focus:outline-none",
          filters.dateFrom && "border-primary bg-primary/5",
        )}
        title="Firmado desde"
        aria-label="Firmado desde"
      />
      <span className="text-text-subtle text-xs">–</span>
      <input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(e) => onUpdate("dateTo", e.target.value || null)}
        className={cn(
          "border-border bg-surface text-text h-8 rounded-md border px-2 text-[12px] focus:border-primary focus:outline-none",
          filters.dateTo && "border-primary bg-primary/5",
        )}
        title="Firmado hasta"
        aria-label="Firmado hasta"
      />
    </div>
  );
}
