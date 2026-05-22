import { PageHeader } from "@/components/ui/PageHeader";
import { NetworkClient } from "./NetworkClient";

export const metadata = { title: "ACE Network — Connections" };

export default function NetworkPage() {
  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <PageHeader
        eyebrow="Connections graph"
        title="ACE Network"
        description="Per-edition delegate network. Pick an ACE, filter by country or actor type, then click any name to see who that delegate connects with — by shared sector of work or same country of origin."
      />
      <NetworkClient />
    </div>
  );
}
