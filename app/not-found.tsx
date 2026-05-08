import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue-bright">404</div>
        <h1 className="text-2xl font-bold text-ink mt-2">Page not found</h1>
        <p className="text-text-secondary text-sm mt-2 max-w-sm">
          The page you were looking for doesn&apos;t exist in the Observatory.
        </p>
        <Link href="/" className="inline-block mt-4">
          <Button variant="primary">Back to Overview</Button>
        </Link>
      </div>
    </div>
  );
}
