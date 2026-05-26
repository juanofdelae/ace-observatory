export function AdminPageHeader({
  eyebrow = "OAS · RIAC · ACE",
  title,
  description,
  count,
  countLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <header>
      <p className="text-accent-blue text-xs font-semibold tracking-widest uppercase">
        {eyebrow}
      </p>
      <h1 className="text-ink mt-3 text-3xl font-bold tracking-tight leading-[1.05] md:text-[2.125rem]">
        {title}
      </h1>
      {description ? (
        <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">{description}</p>
      ) : null}
      {typeof count === "number" ? (
        <p className="text-text-muted mt-3 text-sm">
          <span className="text-ink font-semibold tabular-nums">{count.toLocaleString()}</span>{" "}
          {countLabel}
        </p>
      ) : null}
    </header>
  );
}

export function AdminEmpty({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={20} className="text-text-subtle px-4 py-12 text-center text-sm">
        {message}
      </td>
    </tr>
  );
}

export function adminTableShell(): {
  table: string;
  thead: string;
  th: string;
  tr: string;
  td: string;
} {
  return {
    table: "w-full text-sm",
    thead:
      "bg-surface-canvas text-text-subtle border-border border-b text-left text-[11px] font-medium tracking-widest uppercase",
    th: "px-4 py-3 font-medium",
    tr: "border-border hover:bg-surface-canvas border-b last:border-0 transition-colors",
    td: "px-4 py-3",
  };
}
