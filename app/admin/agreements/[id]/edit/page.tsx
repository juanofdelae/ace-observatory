import Link from "next/link";
import { notFound } from "next/navigation";

import { getAgreementDetail } from "@/lib/admin/queries/agreements";
import { prisma } from "@/lib/prisma";

import { AdminPageHeader } from "../../../_components/page-header";
import { AgreementForm } from "../../_components/agreement-form";

export const metadata = { title: "Editar acuerdo" };

type Params = Promise<{ id: string }>;

export default async function EditAgreementPage({ params }: { params: Params }) {
  const { id } = await params;
  const [a, editions, institutions] = await Promise.all([
    getAgreementDetail(id),
    prisma.edition.findMany({
      orderBy: [{ year: "desc" }, { startDate: "desc" }],
      select: { id: true, name: true },
    }),
    prisma.institution.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, countryLabel: true },
    }),
  ]);

  if (!a) notFound();

  const initialValues = {
    code: a.code,
    editionId: a.editionId,
    instrumentType: a.instrumentType,
    signedDate: a.signedDate.toISOString().slice(0, 10),
    partyAId: a.partyAId,
    partyBId: a.partyBId,
    subject: a.subject,
    primarySector: a.primarySector,
    tags: a.tags.join(", "),
    delegate: a.delegate ?? "",
    phase: a.phase,
    alertStatus: a.alertStatus,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href={`/admin/agreements/${a.id}`}
          className="text-text-muted hover:text-text text-xs transition-colors"
        >
          ← {a.code}
        </Link>
        <div className="mt-4">
          <AdminPageHeader
            eyebrow={`Editando · ${a.code}`}
            title="Editar acuerdo"
            description="Modifica cualquier campo y guarda. Los cambios quedan registrados en el historial."
          />
        </div>
      </div>

      <AgreementForm
        editions={editions}
        institutions={institutions}
        mode={{ kind: "edit", agreementId: a.id, initialValues }}
      />
    </div>
  );
}
