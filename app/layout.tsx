import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "ACE Observatory",
  description:
    "Institutional observatory for the Americas Competitiveness Exchange (ACE) — editions, participants, host cities, visited sites, outcomes and media evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="bg-surface-canvas text-ink antialiased font-sans">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
