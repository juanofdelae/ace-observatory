import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { AdminPageHeader } from "../../_components/page-header";
import { AgreementForm } from "../_components/agreement-form";

export const metadata = { title: "Nuevo acuerdo" };

export default async function NewAgreementPage() {
  const [editions, institutions] = await Promise.all([
    prisma.edition.findMany({
      orderBy: [{ year: "desc" }, { startDate: "desc" }],
      select: { id: true, name: true, endDate: true },
    }),
    prisma.institution.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, countryLabel: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/agreements"
          className="text-text-muted hover:text-text text-xs transition-colors"
        >
          ← Acuerdos
        </Link>
        <div className="mt-4">
          <AdminPageHeader
            title="Nuevo acuerdo"
            description={`Registra una nueva carta de intención o memorando firmado durante una edición del ACE. ${institutions.length} instituciones disponibles para seleccionar como partes.`}
          />
        </div>
      </div>

      <AgreementForm editions={editions} institutions={institutions} />
    </div>
  );
}
