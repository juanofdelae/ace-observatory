import Link from "next/link";

import { SidebarNav, type NavCounts } from "@/components/admin-layout/sidebar-nav";
import { UserMenu } from "@/components/admin-layout/user-menu";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: { email: string; name?: string | null; role: string };
  className?: string;
};

/**
 * Server-side fetch of nav counts. Each query is a cheap COUNT(*) — they
 * run in parallel and serialize into one page render. We only count rows
 * the user would actually want to triage (open support, programmed surveys
 * still pending, etc.) instead of totals.
 */
async function loadNavCounts(): Promise<NavCounts> {
  const [agreements, openSupport, pendingSurveys, institutions, participants, editions] =
    await Promise.all([
      prisma.agreement.count({ where: { deletedAt: null } }),
      prisma.supportRequest.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.survey.count({ where: { sentAt: null, scheduledFor: { not: null } } }),
      prisma.institution.count({ where: { deletedAt: null } }),
      prisma.participant.count({ where: { deletedAt: null } }),
      prisma.edition.count(),
    ]);

  return {
    "/admin/agreements": agreements,
    "/admin/support": openSupport,
    "/admin/surveys": pendingSurveys,
    "/admin/institutions": institutions,
    "/admin/participants": participants,
    "/admin/editions": editions,
  };
}

export async function Sidebar({ user, className }: SidebarProps) {
  // Failing the count query should not break the whole admin shell — fall
  // back to no counts and let the pages render normally.
  const counts = await loadNavCounts().catch(() => ({}));

  return (
    <aside
      className={cn(
        "bg-muted/50 border-sidebar-border flex h-full w-full flex-col border-r",
        className,
      )}
    >
      <div className="flex h-16 items-center px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold tracking-tight">
            AB
          </span>
          <span className="text-text text-[15px] font-semibold tracking-tight">ACE Bridge</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <SidebarNav counts={counts} />
      </div>

      <div className="px-3 pb-3">
        <UserMenu email={user.email} name={user.name} role={user.role} />
      </div>
    </aside>
  );
}
