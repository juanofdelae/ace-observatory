// Registry of exit-survey datasets keyed by edition id. Each JSON is
// produced by scripts/extract_finals_surveys.py (the QuestionPro
// workbooks under info-reports/FinalsSurvey/), with the legacy Córdoba
// 2025 file additionally enriched with pre-vs-post knowledge growth from
// Book1.xlsx via scripts/extract_survey_data.py.

import survey14 from "./_survey-ace14.json";
import survey15 from "./_survey-ace15.json";
import survey16 from "./_survey-ace16.json";
import survey17 from "./_survey-ace17.json";
import survey18 from "./_survey-ace18.json";
import survey19 from "./_survey-ace19.json";
import survey20 from "./_survey-ace20.json";
import survey21 from "./_survey-ace21.json";
import survey22 from "./_survey-ace22.json";

export interface SurveyAspectRating {
  label: string;
  mean: number;
  levels: Record<string, number>;
}

export interface SurveyDistribution {
  options: { label: string; count: number; pct: number }[];
  total: number;
  mean: number;
}

export interface SurveyKnowledgeBlock {
  topic: string;
  pre: Record<string, number>;
  exit: Record<string, number>;
}

export interface SurveyImpactItem {
  label: string;
  count: number;
  pct: number;
}

export interface SurveyConnections {
  mean: number;
  median: number;
  total: number;
  buckets: { range: string; count: number }[];
}

export interface SurveyEquityRatings {
  genderYouth: SurveyDistribution;
  equityImportance: SurveyDistribution;
}

export interface SurveyQuote {
  question: string;
  name: string;
  country: string;
  text: string;
}

export interface SurveyData {
  editionId: string;
  totalResponses: number;
  overallRating: SurveyDistribution;
  aspectRatings: SurveyAspectRating[];
  recommend: SurveyDistribution;
  knowledgeScope: SurveyKnowledgeBlock[];
  programImpact: SurveyImpactItem[];
  sessionsAttended?: { range: string; count: number }[];
  knowledgeGrowth?: SurveyKnowledgeBlock[];
  countryDistribution: { country: string; count: number; pct: number }[];
  connectionsCount?: SurveyConnections;
  equityRatings?: SurveyEquityRatings;
  qualitativeQuotes?: SurveyQuote[];
}

const SURVEYS: Record<string, SurveyData> = {
  [survey14.editionId]: survey14 as SurveyData,
  [survey15.editionId]: survey15 as SurveyData,
  [survey16.editionId]: survey16 as SurveyData,
  [survey17.editionId]: survey17 as SurveyData,
  [survey18.editionId]: survey18 as SurveyData,
  [survey19.editionId]: survey19 as SurveyData,
  [survey20.editionId]: survey20 as SurveyData,
  [survey21.editionId]: survey21 as SurveyData,
  [survey22.editionId]: survey22 as SurveyData,
};

export const surveyByEdition = (editionId: string): SurveyData | undefined =>
  SURVEYS[editionId];

export const hasSurvey = (editionId: string): boolean => editionId in SURVEYS;

export const allSurveys = (): SurveyData[] => Object.values(SURVEYS);
