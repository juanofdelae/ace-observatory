"use client";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { countries } from "@/data/countries";
import { sectors } from "@/data/sectors";
import { editions } from "@/data/editions";
import { editionRegion } from "@/lib/utils";
import { X } from "lucide-react";
import type { FilterState } from "@/types";

interface Props {
  value: FilterState;
  onChange: (f: FilterState) => void;
  fields?: Array<keyof FilterState>;
  className?: string;
}

export function FilterBar({ value, onChange, fields, className }: Props) {
  const active = (Object.keys(value) as (keyof FilterState)[]).filter(k => value[k] !== undefined && value[k] !== "");
  const showField = (k: keyof FilterState) => !fields || fields.includes(k);

  const set = <K extends keyof FilterState>(k: K, v: FilterState[K] | undefined) =>
    onChange({ ...value, [k]: v });

  return (
    <div className={"bg-white rounded-xl border border-surface-border p-3 flex flex-wrap items-center gap-2 " + (className ?? "")}>
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted pl-1 pr-1">
        Filters
      </span>

      {showField("year") && (
        <Select value={value.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All years</option>
          {[2026, 2025, 2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      )}

      {showField("editionId") && (
        <Select value={value.editionId ?? ""} onChange={(e) => set("editionId", e.target.value || undefined)}>
          <option value="">All editions</option>
          {editions.slice().reverse().map(e => (
            <option key={e.id} value={e.id}>ACE {e.number} — {editionRegion(e)}</option>
          ))}
        </Select>
      )}

      {showField("countryId") && (
        <Select value={value.countryId ?? ""} onChange={(e) => set("countryId", e.target.value || undefined)}>
          <option value="">All countries</option>
          {countries.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      )}

      {showField("sectorId") && (
        <Select value={value.sectorId ?? ""} onChange={(e) => set("sectorId", e.target.value || undefined)}>
          <option value="">All sectors</option>
          {sectors.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      )}

      {showField("actorType") && (
        <Select value={value.actorType ?? ""} onChange={(e) => set("actorType", e.target.value ? (e.target.value as FilterState["actorType"]) : undefined)}>
          <option value="">All actor types</option>
          {["Government", "Private Sector", "Academia", "International Organization", "Entrepreneurial Ecosystem"].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      )}

      {showField("institutionType") && (
        <Select value={value.institutionType ?? ""} onChange={(e) => set("institutionType", e.target.value ? (e.target.value as FilterState["institutionType"]) : undefined)}>
          <option value="">All types</option>
          {["University", "Company", "Innovation Center", "Public Entity", "Technology Hub", "Cluster", "Research Lab"].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      )}

      {showField("mediaType") && (
        <Select value={value.mediaType ?? ""} onChange={(e) => set("mediaType", e.target.value ? (e.target.value as FilterState["mediaType"]) : undefined)}>
          <option value="">All media</option>
          <option value="photo">Photos</option>
          <option value="video">Videos</option>
          <option value="report">Reports</option>
          <option value="trip_book">Trip Books</option>
          <option value="presentation">Presentations</option>
          <option value="document">Documents</option>
        </Select>
      )}

      {showField("outcomeCategory") && (
        <Select value={value.outcomeCategory ?? ""} onChange={(e) => set("outcomeCategory", e.target.value ? (e.target.value as FilterState["outcomeCategory"]) : undefined)}>
          <option value="">All categories</option>
          {["Partnership", "Derived Project", "Success Story", "Best Practice", "Follow-up", "Investment", "Policy"].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      )}

      {active.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          <X size={12} /> Clear
        </Button>
      )}
    </div>
  );
}
