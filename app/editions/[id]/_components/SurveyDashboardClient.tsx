"use client";

import dynamic from "next/dynamic";

export const SurveyDashboard = dynamic(
  () => import("@/components/SurveyDashboard").then((m) => m.SurveyDashboard),
  { ssr: false },
);
