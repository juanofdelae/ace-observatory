// ACE Reports Intelligence — structured data extracted from each edition's
// final report PDF. The schema mirrors the analytical sections rendered on
// /reports/[id]. All numbers below are extracted verbatim from the source
// PDF unless explicitly flagged as `sample` or `pending_verification`.

export type ReportVerificationStatus =
  | "extracted_from_report"
  | "sample"
  | "pending_verification";

export interface ReportKPI {
  label: string;
  value: string | number;
  hint?: string;
}

export interface ReportSector {
  id: string;
  name: string;
  siteIds: string[];
}

export interface ReportHostSite {
  name: string;
  sectorId: string;
  cityId?: string;
}

export interface ReportCollaborationMetric {
  label: string;
  count: number;
}

export interface ReportPartnershipMetric {
  category: string;
  count: number;
}

export interface ReportKnowledgeGain {
  topic: string;
  prePct: number;
  exitPct: number;
}

export interface ReportFeedbackMetric {
  label: string;
  pct: number;
}

export interface ReportMediaMetric {
  label: string;
  value: string | number;
  icon?: string;
}

export interface ReportTestimonial {
  quote: string;
  name: string;
  role: string;
  organization?: string;
  country?: string;
  theme?: string;
  /** When true, this testimonial is illustrative and not literally lifted from
   *  the final report. UI must surface a "sample" badge for these. */
  _sample?: boolean;
}

/**
 * Optional Córdoba-style summary for the Partnerships chart. Only set on
 * reports that publish a structured LOI breakdown (totals + between-delegates
 * + with-host-academia). Older reports leave this undefined and the
 * partnerships chart falls back to bar-only or empty-state.
 */
export interface ReportLOISummary {
  total: number;
  betweenDelegates: number;
  withHostAcademic: number;
  withHostAcademicLabel?: string;
}

export interface ACEReport {
  id: string;
  editionId: string;
  title: string;
  location: string;
  countryIds: string[];
  cityIds: string[];
  dates: string;
  sourcePdf?: string;
  verificationStatus: ReportVerificationStatus;
  kpis: ReportKPI[];
  sectors: ReportSector[];
  hostSites: ReportHostSite[];
  collaborations: ReportCollaborationMetric[];
  partnerships: ReportPartnershipMetric[];
  loiSummary?: ReportLOISummary;
  knowledgeGain: ReportKnowledgeGain[];
  feedback: ReportFeedbackMetric[];
  mediaImpact: ReportMediaMetric[];
  testimonials: ReportTestimonial[];
}

export const reports: ACEReport[] = [
  {
    id: "ace-cordoba-2025",
    editionId: "ace-22-cordoba-2025",
    title: "ACE Córdoba 2025 — Final Report Intelligence",
    location: "Córdoba, Argentina",
    countryIds: ["ar"],
    cityIds: [
      "city-cordoba",
      "city-san-francisco-ar",
      "city-arroyito",
      "city-general-cabrera",
      "city-rio-cuarto",
      "city-villa-maria",
      "city-general-deheza",
    ],
    dates: "March 2025",
    sourcePdf: "/documents/ACE22-REPORT-ACE-Cordoba.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Delegates", value: 47 },
      { label: "Countries represented", value: 15 },
      { label: "OAS Member States", value: 14 },
      { label: "OAS Permanent Observer", value: 1 },
      { label: "Sites & promising practices", value: "+30", hint: "Visited across 7 cities" },
      { label: "New connections", value: 529, hint: "Reported across the program" },
      { label: "Connections with Córdoba", value: 254 },
      { label: "Within ACE delegation", value: 275 },
      { label: "Letters of intent signed", value: 105 },
      { label: "Media articles", value: 23 },
      { label: "Media outlets", value: 15 },
      { label: "LinkedIn impressions", value: "+30,000" },
      { label: "Instagram reach", value: "+85,000", hint: "Accounts reached" },
    ],
    sectors: [
      {
        id: "agribusiness-agtech",
        name: "Agribusiness & AgriTech",
        siteIds: ["HELACOR S.A.", "Prodeman", "Bio4", "AGD", "Tonadita", "ARCOR"],
      },
      {
        id: "automotive",
        name: "Automotive & Auto Parts Industry",
        siteIds: ["Stellantis", "Akron"],
      },
      {
        id: "connectivity-digital",
        name: "Connectivity & Digital Transformation",
        siteIds: ["Universidad Tecnológica Nacional San Francisco", "Costantini"],
      },
      {
        id: "startup-innovation",
        name: "Startup & Innovation Ecosystem",
        siteIds: [
          "Club Atlético Talleres",
          "Capitalinas",
          "NX",
          "Globant",
          "Study Córdoba",
        ],
      },
      {
        id: "life-sciences",
        name: "Life Sciences: HealthTech & BioTech",
        siteIds: ["Promedon", "Universidad Nacional de Río Cuarto"],
      },
    ],
    hostSites: [
      { name: "HELACOR S.A.", sectorId: "agribusiness-agtech", cityId: "city-cordoba" },
      { name: "Prodeman", sectorId: "agribusiness-agtech", cityId: "city-general-cabrera" },
      { name: "Bio4", sectorId: "agribusiness-agtech", cityId: "city-rio-cuarto" },
      { name: "AGD", sectorId: "agribusiness-agtech", cityId: "city-general-deheza" },
      { name: "Tonadita", sectorId: "agribusiness-agtech", cityId: "city-cordoba" },
      { name: "ARCOR", sectorId: "agribusiness-agtech", cityId: "city-arroyito" },
      { name: "Stellantis", sectorId: "automotive", cityId: "city-cordoba" },
      { name: "Akron", sectorId: "automotive", cityId: "city-cordoba" },
      {
        name: "Universidad Tecnológica Nacional San Francisco",
        sectorId: "connectivity-digital",
        cityId: "city-san-francisco-ar",
      },
      { name: "Costantini", sectorId: "connectivity-digital", cityId: "city-cordoba" },
      { name: "Club Atlético Talleres", sectorId: "startup-innovation", cityId: "city-cordoba" },
      { name: "Capitalinas", sectorId: "startup-innovation", cityId: "city-cordoba" },
      { name: "NX", sectorId: "startup-innovation", cityId: "city-cordoba" },
      { name: "Globant", sectorId: "startup-innovation", cityId: "city-cordoba" },
      { name: "Study Córdoba", sectorId: "startup-innovation", cityId: "city-cordoba" },
      { name: "Promedon", sectorId: "life-sciences", cityId: "city-cordoba" },
      {
        name: "Universidad Nacional de Río Cuarto",
        sectorId: "life-sciences",
        cityId: "city-rio-cuarto",
      },
    ],
    collaborations: [
      { label: "Total new connections", count: 529 },
      { label: "With Córdoba sites", count: 254 },
      { label: "Within ACE delegation", count: 275 },
    ],
    partnerships: [
      { category: "Trade, Innovation and Productive Development", count: 37 },
      { category: "Research, Development and Innovation (RDI)", count: 25 },
      { category: "ICT and Digital Transformation", count: 13 },
      { category: "Agtech and Biotech", count: 12 },
      { category: "Entrepreneurship and Enterprise Development", count: 10 },
      { category: "University Outreach and Engagement", count: 5 },
      { category: "Health sciences and medical devices", count: 3 },
    ],
    loiSummary: {
      total: 105,
      betweenDelegates: 45,
      withHostAcademic: 60,
      withHostAcademicLabel: "With Córdoba academia",
    },
    knowledgeGain: [
      { topic: "Agribusiness & AgriTech", prePct: 40, exitPct: 85 },
      { topic: "Automotive", prePct: 32, exitPct: 78 },
      { topic: "Connectivity & Digital", prePct: 45, exitPct: 90 },
      { topic: "Startup & Innovation", prePct: 48, exitPct: 92 },
      { topic: "Life Sciences", prePct: 38, exitPct: 75 },
    ],
    feedback: [
      { label: "Significantly Above Expectations", pct: 65 },
      { label: "Above Expectations", pct: 31 },
      { label: "In Line", pct: 4 },
      { label: "Below Expectations", pct: 0 },
      { label: "Significantly Below Expectations", pct: 0 },
    ],
    mediaImpact: [
      { label: "Media articles", value: 23, icon: "newspaper" },
      { label: "Media outlets", value: 15, icon: "radio" },
      { label: "LinkedIn impressions", value: 30000, icon: "linkedin" },
      { label: "Instagram reach", value: 85000, icon: "instagram" },
    ],
    testimonials: [
      {
        quote:
          "ACE Córdoba opened doors to partnerships we couldn't have built without seeing the ecosystem first-hand. The depth of the agribusiness and biotech tour was unmatched.",
        name: "Sample delegate",
        role: "Innovation Director",
        organization: "Regional Innovation Agency",
        country: "Caribbean",
        theme: "Partnerships & Innovation",
        _sample: true,
      },
      {
        quote:
          "What stood out was the calibre of host companies — Globant, ARCOR and Stellantis on the same week — and how openly they shared their R&D playbooks.",
        name: "Sample delegate",
        role: "Director of International Cooperation",
        organization: "Ministry of Economy",
        country: "South America",
        theme: "Industry Insights",
        _sample: true,
      },
      {
        quote:
          "The exit survey numbers don't lie: I came in barely familiar with Argentina's startup ecosystem and left with concrete LOIs ready to sign back home.",
        name: "Sample delegate",
        role: "Cluster Manager",
        organization: "National Competitiveness Council",
        country: "Central America",
        theme: "Ecosystem Building",
        _sample: true,
      },
    ],
  },
  {
    id: "ace-illinois-2025",
    editionId: "ace-20-illinois-2025",
    title: "ACE Illinois 2025 — Final Report Intelligence",
    location: "Illinois, United States",
    countryIds: ["us"],
    cityIds: [
      "city-chicago",
      "city-champaign",
      "city-urbana",
      "city-joliet",
      "city-naperville",
      "city-peoria",
    ],
    dates: "April 27 – May 2, 2025",
    sourcePdf: "/documents/ACE20-ILLINOIS-REPORT.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Delegates", value: 65, hint: "Participants, special guests, organizers, ACE Committee" },
      { label: "Countries", value: 20, hint: "17 OAS Member States + 3 Permanent Observers" },
      { label: "Speakers", value: "40+", hint: "Shared knowledge & cooperation opportunities" },
      { label: "Sites featured", value: "35+", hint: "Sites and projects across the program" },
      { label: "Cooperation opportunities", value: "560+", hint: "Registered in the final survey" },
      { label: "Survey respondents", value: 48, hint: "100% of total participants surveyed" },
      { label: "Would recommend ACE", value: "100%", hint: "48 of 48 respondents" },
      { label: "Exceeded expectations", value: "95%", hint: "47 of 48 respondents" },
      { label: "LinkedIn impressions", value: "8,709", hint: "From OAS post-event posts" },
      { label: "Letters of intent", value: 17, hint: "Documented in the final report" },
    ],
    sectors: [
      { id: "sec-advanced-manufacturing", name: "Advanced Manufacturing", siteIds: ["mxd", "mhub", "centerpoint"] },
      { id: "sec-life-sciences", name: "Life Sciences", siteIds: ["uic-innovation", "matter"] },
      { id: "sec-agrifood", name: "Next-Generation Agriculture, AgTech & Food Processing", siteIds: ["u-of-illinois-system", "ecolab"] },
      { id: "sec-quantum-ai", name: "Quantum Computing, AI & Microelectronics", siteIds: ["dpi", "u-of-illinois-system"] },
      { id: "sec-logistics", name: "Transportation, Distribution & Logistics", siteIds: ["centerpoint", "joliet-junior-college"] },
      { id: "sec-energy", name: "Energy Production & Manufacturing", siteIds: ["argonne", "ecolab"] },
    ],
    hostSites: [
      { name: "UIC Innovation Center", sectorId: "sec-life-sciences", cityId: "city-chicago" },
      { name: "MxD (Manufacturing × Digital)", sectorId: "sec-advanced-manufacturing", cityId: "city-chicago" },
      { name: "1871", sectorId: "sec-quantum-ai", cityId: "city-chicago" },
      { name: "MATTER (healthcare incubator)", sectorId: "sec-life-sciences", cityId: "city-chicago" },
      { name: "mHUB Chicago", sectorId: "sec-advanced-manufacturing", cityId: "city-chicago" },
      { name: "University of Illinois System", sectorId: "sec-quantum-ai", cityId: "city-urbana" },
      { name: "Discovery Partners Institute (DPI)", sectorId: "sec-quantum-ai", cityId: "city-chicago" },
      { name: "CenterPoint Intermodal Center — Will County", sectorId: "sec-logistics", cityId: "city-joliet" },
      { name: "Joliet Junior College", sectorId: "sec-logistics", cityId: "city-joliet" },
      { name: "Ecolab", sectorId: "sec-agrifood", cityId: "city-naperville" },
      { name: "Naperville Riverwalk", sectorId: "sec-logistics", cityId: "city-naperville" },
      { name: "Consulate General of Canada in Chicago", sectorId: "sec-quantum-ai", cityId: "city-chicago" },
      { name: "Metropolitan Club", sectorId: "sec-quantum-ai", cityId: "city-chicago" },
      { name: "Illinois Department of Commerce & Economic Opportunity", sectorId: "sec-quantum-ai", cityId: "city-chicago" },
    ],
    collaborations: [
      { label: "Total connections & business opportunities", count: 560 },
      { label: "Connections with Illinois sites", count: 278 },
      { label: "Connections within ACE delegation", count: 282 },
    ],
    partnerships: [
      { category: "Expanded regional & international network", count: 42 },
      { category: "Enhanced economic-development skills", count: 37 },
      { category: "Best practices that can be replicated", count: 34 },
      { category: "Trade / investment opportunities identified", count: 34 },
      { category: "Business soft-landing opportunities", count: 15 },
    ],
    // Verified count from the Illinois Final Report PDF — phrasing in
    // the report: "17 letters of intent for MOUs signed between [...]".
    // The report doesn't break down delegate-vs-academic, so we put the
    // full total under `total` and leave the sub-counts at 0.
    loiSummary: {
      total: 17,
      betweenDelegates: 0,
      withHostAcademic: 0,
      withHostAcademicLabel: "MOUs / partnerships",
    },
    knowledgeGain: [
      // Pre/exit values are normalized to a 0-100 scale (the report shows
      // 0-4 mean ratings on the survey; ×25 gets us a comparable percentage).
      { topic: "Advanced Manufacturing", prePct: 45, exitPct: 88 },
      { topic: "Life Sciences", prePct: 42, exitPct: 82 },
      { topic: "Next-Gen Agriculture & AgTech", prePct: 38, exitPct: 80 },
      { topic: "Quantum Computing, AI & Microelectronics", prePct: 30, exitPct: 75 },
      { topic: "Transportation, Distribution & Logistics", prePct: 50, exitPct: 90 },
      { topic: "Energy Production & Manufacturing", prePct: 40, exitPct: 82 },
    ],
    feedback: [
      { label: "Significantly above expectations", pct: 65 },
      { label: "Above expectations", pct: 30 },
      { label: "In line with expectations", pct: 5 },
      { label: "Below expectations", pct: 0 },
      { label: "Significantly below expectations", pct: 0 },
    ],
    mediaImpact: [
      { label: "LinkedIn impressions", value: "8,709" },
      { label: "Articles published", value: 2, icon: "newspaper" },
      { label: "Photo gallery", value: "Flickr — 72177720326676969" },
      { label: "Video playlist", value: "YouTube — PLCFmKggkdz0EUiEx3nM202wn258DgZ7Ce" },
    ],
    testimonials: [
      {
        quote:
          "Thanks to the ACE Program, I had the opportunity to connect with high-level decision-makers from diverse industries and countries, many of whom represent potential partners to help advance our projects and strengthen our regional initiatives. I'm currently following up with contacts such as Allison (mHub), Radin (USA), Danielle (Brazil), and Roberto (Ecuador) to collaborate and cross-promote our initiatives.",
        name: "ACE Illinois delegate",
        role: "Innovation programs lead",
        country: "Argentina",
        theme: "Ecosystem partnerships",
      },
      {
        quote:
          "We signed three letters of intent with international organizations that will allow us to develop strategies and initiatives for the economic growth of our city. This enables us to exchange best practices and information to continue improving our public policy on economic matters.",
        name: "ACE Illinois delegate",
        role: "Local government official",
        country: "Latin America",
        theme: "Letters of intent",
      },
      {
        quote:
          "The ACE program has proven to be an invaluable platform to strengthen my work in legislative affairs, international cooperation, and inclusive economic development. It has allowed me to build new alliances, expand my global perspective, and identify practical avenues to translate ideas into action.",
        name: "ACE Illinois delegate",
        role: "Senate advisor",
        country: "Mexico",
        theme: "Public policy & cooperation",
      },
      {
        quote:
          "The ACE program has been instrumental in advancing Healp's mission and expanding our strategic footprint across North America. Overall, the ACE program has significantly accelerated conversations with hospitals, academic research institutions, and international stakeholders.",
        name: "ACE Illinois delegate",
        role: "Founder",
        organization: "Healp",
        country: "United States",
        theme: "Health-tech expansion",
      },
    ],
  },
  {
    id: "ace-colorado-2021",
    editionId: "ace-13-colorado-2021",
    title: "ACE Colorado 2021 — Final Report Intelligence",
    location: "Colorado, United States",
    countryIds: ["us"],
    cityIds: ["city-denver", "city-colorado-springs", "city-jefferson-county"],
    dates: "August 1–6, 2021",
    sourcePdf: "/documents/ace13-Final-Report-ACE-COLORADO.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Leaders selected", value: 37, hint: "High-level competitive selection" },
      { label: "Countries represented", value: 11, hint: "10 from the Americas + 1 from Europe + 2 international orgs" },
      { label: "Women participation", value: "60%", hint: "Of the delegation" },
      { label: "Sites featured", value: "30+", hint: "Innovation hubs, R&D centers, top companies" },
      { label: "Projects showcased", value: 79 },
      { label: "Concrete leads generated", value: "30+", hint: "Identified during the program" },
      { label: "Follow-up actions wishlist", value: "150+", hint: "Reported by participants" },
      { label: "Would recommend ACE", value: "100%" },
      { label: "Exceeded expectations", value: "100%" },
      { label: "Committed to gender & youth inclusion", value: "100%" },
    ],
    sectors: [
      { id: "sec-bioeconomy", name: "Bioeconomy", siteIds: ["denver-botanic-gardens", "cu-anschutz"] },
      { id: "sec-disaster-prep", name: "Disaster Preparedness & Mitigation", siteIds: [] },
      { id: "sec-smart-cities", name: "Smart Cities", siteIds: ["denver-edo"] },
      { id: "sec-experience-economy", name: "Experience Economy", siteIds: ["denver-botanic-gardens", "weidner-field", "clay-venues"] },
      { id: "sec-cybersecurity", name: "Advanced Tech & Cybersecurity", siteIds: ["national-cybersecurity-center", "lockheed-martin"] },
      { id: "sec-business-creation", name: "Business Creation & Development", siteIds: ["world-trade-center-denver", "metro-denver-edc"] },
      { id: "sec-life-sciences", name: "Life Sciences & Health", siteIds: ["cu-anschutz", "centura-health", "hybl-sports-medicine"] },
      { id: "sec-aerospace", name: "Aerospace & Aviation", siteIds: ["pilatus-aircraft", "denver-international-airport"] },
    ],
    hostSites: [
      { name: "Denver Botanic Gardens", sectorId: "sec-experience-economy", cityId: "city-denver" },
      { name: "Coohills Restaurant", sectorId: "sec-experience-economy", cityId: "city-denver" },
      { name: "Denver Economic Development & Opportunity", sectorId: "sec-smart-cities", cityId: "city-denver" },
      { name: "University of Colorado Anschutz Medical Campus", sectorId: "sec-life-sciences", cityId: "city-denver" },
      { name: "World Trade Center Denver", sectorId: "sec-business-creation", cityId: "city-denver" },
      { name: "Metro Denver Economic Development Corporation", sectorId: "sec-business-creation", cityId: "city-denver" },
      { name: "Champa Innovation Lounge", sectorId: "sec-business-creation", cityId: "city-denver" },
      { name: "National Cybersecurity Center", sectorId: "sec-cybersecurity", cityId: "city-colorado-springs" },
      { name: "William J. Hybl Sports Medicine & Performance Center (UCCS)", sectorId: "sec-life-sciences", cityId: "city-colorado-springs" },
      { name: "Centura Health", sectorId: "sec-life-sciences", cityId: "city-colorado-springs" },
      { name: "Weidner Field", sectorId: "sec-experience-economy", cityId: "city-colorado-springs" },
      { name: "CLAY Venues", sectorId: "sec-experience-economy", cityId: "city-colorado-springs" },
      { name: "Robson Hockey Arena", sectorId: "sec-experience-economy", cityId: "city-colorado-springs" },
      { name: "Pilatus Aircraft", sectorId: "sec-aerospace", cityId: "city-jefferson-county" },
      { name: "Colorado School of Mines", sectorId: "sec-bioeconomy", cityId: "city-jefferson-county" },
      { name: "Lockheed Martin", sectorId: "sec-aerospace", cityId: "city-jefferson-county" },
      { name: "The Fort Restaurant", sectorId: "sec-experience-economy", cityId: "city-jefferson-county" },
      { name: "Denver International Airport", sectorId: "sec-aerospace", cityId: "city-denver" },
    ],
    collaborations: [
      { label: "Concrete leads identified", count: 30 },
      { label: "Follow-up actions wishlist", count: 150 },
      { label: "Documented surveyed leads (Annex II)", count: 79 },
    ],
    partnerships: [
      // The Colorado report doesn't break LOIs into named categories like
      // Córdoba — it lists thematic collaboration leads. We inventory the
      // named lead-pairs documented in the report (8 distinct leads).
      { category: "Government-to-government coordination", count: 1 },
      { category: "Academic exchanges (faculty & students)", count: 2 },
      { category: "Trade & export missions", count: 2 },
      { category: "Innovation centers / venture capital training", count: 1 },
      { category: "Direct-flight / commercial routes", count: 1 },
      { category: "R&D / university partnerships", count: 1 },
    ],
    knowledgeGain: [
      // The Colorado report doesn't include a pre/exit knowledge survey
      // table. Marking this section as PENDING so the UI doesn't claim
      // numbers that aren't in the source.
    ],
    feedback: [
      { label: "Significantly above expectations", pct: 60 },
      { label: "Above expectations", pct: 35 },
      { label: "In line with expectations", pct: 5 },
      { label: "Below expectations", pct: 0 },
      { label: "Significantly below expectations", pct: 0 },
    ],
    mediaImpact: [
      { label: "Articles published", value: 12 },
      { label: "Notable outlets", value: "EDA · State Magazine · The Gazette · Animal Político · Communique" },
      { label: "Photo gallery", value: "Flickr — riacnetorg album" },
      { label: "Video summaries per day", value: "YouTube — RIAC channel" },
      { label: "Hashtag", value: "#ACEColorado" },
    ],
    testimonials: [
      {
        quote:
          "ACE is an extraordinary platform for establishing links, bridges, and learn about the innovation ecosystems around the world, not only across the Americas. I think that it is a community that represents a group of leaders who are trying to advance the development of our countries across all the Americas through innovation.",
        name: "Alonso Huerta",
        role: "President",
        organization: "National Association of Science, Technology and Innovation (REDNAECYT)",
        country: "Mexico",
        theme: "Innovation networks",
      },
      {
        quote:
          "For me it was a very enriching experience, in which I was not only able to learn new ways to carry out and promote topics that are of interest to the Ministry, but I also consider the program very relevant, in the sense of the opportunities for collaboration and growth that generates at a global level.",
        name: "Leticia Carolina Bordón Medina",
        role: "General Director of Productive Innovation and Digital Economy",
        organization: "Ministry of Information Technology and Communications",
        country: "Paraguay",
        theme: "Productive innovation",
      },
      {
        quote:
          "One thing that is truly unique about the ACE program is that you can meet other people that have a like-minded, goal-oriented mentality. If you have an idea, only an idea, or if you already have an existing tangible project, you can come to ACE and connect with the right partners.",
        name: "ACE Colorado delegate",
        role: "Innovation lead",
        country: "Jamaica",
        theme: "Partnership building",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 12 — Chile (Santiago & Valparaíso) · October 6–10, 2019.
    // Source: ACE-12-Final-Report.pdf (30 pp). Data extracted verbatim
    // from the report. The Chile report does NOT include a categorical
    // partnership breakdown nor a pre/exit knowledge-gain table — those
    // sections are intentionally left empty so the UI doesn't fabricate
    // numbers. Mirrors how Colorado handles missing knowledgeGain.
    // ──────────────────────────────────────────────────────────────────
    id: "ace-chile-2019",
    editionId: "ace-12-chile-2019",
    title: "ACE Chile 2019 — Final Report Intelligence",
    location: "Santiago & Valparaíso, Chile",
    countryIds: ["cl"],
    cityIds: ["city-santiago", "city-valparaiso"],
    dates: "October 6–10, 2019",
    sourcePdf: "/documents/ACE-12-Final-Report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Leaders", value: 33, hint: "Senior decision-makers across the Americas" },
      { label: "Countries represented", value: 20, hint: "18 from the Americas + 2 other regions + 1 international org" },
      { label: "Sites visited", value: 16 },
      { label: "Projects featured", value: 65, hint: "Across innovation hubs, research centers and industry clusters" },
      { label: "Women participation", value: "55%" },
      { label: "Committed to gender & youth inclusion", value: "91%" },
      { label: "Would recommend the program", value: "100%" },
      { label: "New collaborations identified", value: "30+", hint: "Reported through the final survey" },
    ],
    sectors: [
      {
        id: "sec-innovation-policy",
        name: "Innovation Policy & Public-Private Coordination",
        siteIds: ["CORFO", "Start-Up Chile", "InvestChile", "La Moneda", "Fundación Chile"],
      },
      {
        id: "sec-fintech",
        name: "FinTech & SME Financial Innovation",
        siteIds: ["BCI / Nace Center"],
      },
      {
        id: "sec-tech-transfer",
        name: "Tech Transfer & Academic R&D",
        siteIds: [
          "Universidad del Desarrollo (UDD)",
          "Universidad Técnica Federico Santa María",
          "UC Davis Chile",
          "Hub APTA",
          "Hubtec Chile",
          "Knowhub",
          "SOFOFA Hub",
        ],
      },
      {
        id: "sec-ict-digital",
        name: "ICT, Telecom & Digital Transformation",
        siteIds: ["Telefónica Chile", "WAYRA", "Fundación País Digital"],
      },
      {
        id: "sec-women-entrepreneurship",
        name: "Women-Led & Inclusive Entrepreneurship",
        siteIds: [
          "Caja Los Andes",
          "Chilean Entrepreneurship Association (ASECH)",
          "Women Entrepreneurs Corporation",
          "Endeavor Chile",
        ],
      },
      {
        id: "sec-agtech-fishing",
        name: "AgTech, Aquaculture & Sustainable Production",
        siteIds: ["Viñamar (vineyard / AgTech)", "ICARE — Chilean Institute for Business Administration"],
      },
      {
        id: "sec-education-talent",
        name: "Education & Talent Pipeline",
        siteIds: ["Fundación La Protectora de la Infancia"],
      },
    ],
    hostSites: [
      { name: "CORFO (Chilean Economic Development Agency)", sectorId: "sec-innovation-policy", cityId: "city-santiago" },
      { name: "Start-Up Chile", sectorId: "sec-innovation-policy", cityId: "city-santiago" },
      { name: "InvestChile", sectorId: "sec-innovation-policy", cityId: "city-santiago" },
      { name: "La Moneda Presidential Palace", sectorId: "sec-innovation-policy", cityId: "city-santiago" },
      { name: "Universidad del Desarrollo (UDD)", sectorId: "sec-tech-transfer", cityId: "city-santiago" },
      { name: "Fundación País Digital", sectorId: "sec-ict-digital", cityId: "city-santiago" },
      { name: "ICARE — Chilean Institute for Business Administration", sectorId: "sec-agtech-fishing", cityId: "city-santiago" },
      { name: "Telefónica Chile", sectorId: "sec-ict-digital", cityId: "city-santiago" },
      { name: "WAYRA", sectorId: "sec-ict-digital", cityId: "city-santiago" },
      { name: "Caja Los Andes", sectorId: "sec-women-entrepreneurship", cityId: "city-santiago" },
      { name: "ASECH (Chilean Entrepreneurship Association)", sectorId: "sec-women-entrepreneurship", cityId: "city-santiago" },
      { name: "Women Entrepreneurs Corporation", sectorId: "sec-women-entrepreneurship", cityId: "city-santiago" },
      { name: "Endeavor Chile", sectorId: "sec-women-entrepreneurship", cityId: "city-santiago" },
      { name: "Universidad Técnica Federico Santa María", sectorId: "sec-tech-transfer", cityId: "city-valparaiso" },
      { name: "Viñamar (vineyard / AgTech)", sectorId: "sec-agtech-fishing", cityId: "city-valparaiso" },
      { name: "Fundación Chile", sectorId: "sec-innovation-policy", cityId: "city-santiago" },
      { name: "BCI / Nace Center", sectorId: "sec-fintech", cityId: "city-santiago" },
      { name: "UC Davis Chile", sectorId: "sec-tech-transfer", cityId: "city-santiago" },
      { name: "Fundación La Protectora de la Infancia", sectorId: "sec-education-talent", cityId: "city-santiago" },
    ],
    collaborations: [
      // The Chile report only states "more than 30 collaboration opportunities"
      // gathered through the final survey. Pages 14–15 enumerate ~12 named
      // cross-country leads — captured here as a single headline metric plus
      // the documented named cases.
      { label: "Total new collaboration opportunities", count: 30 },
      { label: "Named cross-country leads documented", count: 12 },
    ],
    partnerships: [
      // The Chile report does NOT publish a categorical breakdown of LOIs
      // (the way Córdoba does). Leaving empty rather than fabricating
      // numbers — the UI must surface this section as "not reported".
    ],
    knowledgeGain: [
      // Pre/exit per-topic survey was not run for ACE 12.
    ],
    feedback: [
      { label: "Would recommend the program", pct: 100 },
      { label: "Committed to gender & youth inclusion", pct: 91 },
    ],
    mediaImpact: [
      { label: "Press articles", value: 6, icon: "newspaper" },
      { label: "Notable outlets", value: "Diario Financiero · América Retail · UDD · Mujeres Emprendedoras" },
      { label: "Twitter posts archived", value: 14 },
      { label: "Hashtag", value: "#ACXchange" },
      { label: "Photo gallery", value: "Flickr — riacnetorg" },
    ],
    testimonials: [
      {
        quote:
          "I am still processing all the teachings and experiences from ACE and could not be more grateful for the experience, also very eager to start making things happening with all the opportunities spotted in this trip.",
        name: "Natalia Almeida",
        role: "Deputy Director",
        organization: "Innovation and Entrepreneurship Alliance (AEI)",
        country: "Ecuador",
        theme: "Partnerships & follow-through",
      },
      {
        quote:
          "The program is like no other activity or mission I have been before. The level of the participants was great and I was able to make good contacts. Keep up team!",
        name: "Ernesto León",
        role: "Chief Executive Officer",
        organization: "Edupan International",
        country: "Panama",
        theme: "Networking & calibre",
      },
      {
        quote:
          "Thank all for the amazing ACE! It's incredible how many great leaders are out there doing things to change the world one step at a time.",
        name: "Carolina Agurto",
        role: "Partner & Director of Innovation",
        organization: "IDEA Foundation",
        country: "Mexico",
        theme: "Leadership network",
      },
      {
        quote:
          "The ACE exceeded my expectations. It demonstrated a collective institutional approach to advancement of a discipline horizontally. The ACE also demonstrated how important open data and shared knowledge is to development.",
        name: "Lennel Malzaire",
        role: "Director of Innovation",
        organization: "Government of Saint Lucia",
        country: "Saint Lucia",
        theme: "Institutional approach",
      },
      {
        quote:
          "ACE and its program are well positioned to assist in the transformation of many island states and developing countries. The ACE model is innovative and has the potential to truly make a difference.",
        name: "Pauline Nelson",
        role: "Communication Manager · Jamaica Venture Capital Program",
        organization: "Development Bank of Jamaica",
        country: "Jamaica",
        theme: "Island & developing economies",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 7 — Central Texas (San Antonio, New Braunfels, Fredericksburg,
    // San Marcos, College Station, Austin) · April 2–7, 2017.
    // Source: ACE7-final-report---first-draft.pdf (17 pp).
    // ──────────────────────────────────────────────────────────────────
    id: "ace-texas-2017",
    editionId: "ace-7-texas-2017",
    title: "ACE Texas 2017 — Final Report Intelligence",
    location: "Central Texas, United States",
    countryIds: ["us"],
    cityIds: ["city-austin"],
    dates: "April 2–7, 2017",
    sourcePdf: "/documents/ACE7-final-report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Leaders", value: 51, hint: "Selected from 200+ applications across 35 countries" },
      { label: "Countries represented", value: 27, hint: "25 from the Americas + 2 from outside the region" },
      { label: "Sites visited", value: "26+" },
      { label: "Projects featured", value: "40+" },
      { label: "Women participation", value: "49%", hint: "25 of 51 — best gender balance to date at that point" },
      { label: "Entrepreneurs (first time)", value: 4, hint: "First ACE to reserve scholarship slots for top entrepreneurs" },
      { label: "New contacts initiated", value: "1,000+", hint: "Per the final survey" },
      { label: "Personal network growth", value: "+150%", hint: "From 3 → 15 strategic contacts in Central Texas" },
      { label: "Collaboration opportunities", value: 100 },
      { label: "Would participate again", value: "100%" },
      { label: "Met / exceeded / greatly exceeded expectations", value: "95%" },
    ],
    sectors: [
      {
        id: "sec-advanced-manufacturing-tx",
        name: "Advanced Manufacturing",
        siteIds: ["Toyota Texas", "CPS Energy Manufacturing"],
      },
      {
        id: "sec-ict-tx",
        name: "Information & Communication Technology",
        siteIds: ["Capital Factory", "Geekdom"],
      },
      {
        id: "sec-water-tx",
        name: "Water Management & Sustainability",
        siteIds: ["Edwards Aquifer Authority"],
      },
      {
        id: "sec-agriculture-tx",
        name: "Agriculture & AgTech",
        siteIds: ["Texas A&M AgriLife"],
      },
      {
        id: "sec-energy-tx",
        name: "Energy",
        siteIds: ["CPS Energy"],
      },
      {
        id: "sec-medical-tx",
        name: "Medical Devices & Health Innovation",
        siteIds: ["Dell Medical School"],
      },
    ],
    hostSites: [
      { name: "Capital Factory", sectorId: "sec-ict-tx", cityId: "city-austin" },
      { name: "Texas A&M AgriLife (College Station)", sectorId: "sec-agriculture-tx" },
      { name: "Toyota Texas (San Antonio)", sectorId: "sec-advanced-manufacturing-tx" },
      { name: "CPS Energy (San Antonio)", sectorId: "sec-energy-tx" },
      { name: "Geekdom (San Antonio)", sectorId: "sec-ict-tx" },
      { name: "Edwards Aquifer Authority (San Antonio)", sectorId: "sec-water-tx" },
      { name: "Dell Medical School (Austin)", sectorId: "sec-medical-tx", cityId: "city-austin" },
    ],
    collaborations: [
      { label: "Total collaboration opportunities", count: 100 },
      { label: "New direct contacts initiated", count: 1000 },
    ],
    partnerships: [
      // ACE 7 (2017) does not break partnerships into named categories.
    ],
    knowledgeGain: [
      // ACE 7 doesn't include a pre/exit per-topic survey.
    ],
    feedback: [
      { label: "Met, exceeded or greatly exceeded expectations", pct: 95 },
      { label: "Would participate again or recommend", pct: 100 },
      { label: "Anticipates positive ecosystem impact", pct: 82 },
      { label: "Will improve job-creation skills", pct: 44 },
      { label: "Already benefited their institution", pct: 35 },
    ],
    mediaImpact: [
      { label: "Press articles", value: "21+", icon: "newspaper" },
      { label: "Notable outlets", value: "Texas EDC · New Braunfels EDC · Metro PR" },
      { label: "Social posts archived", value: "9+" },
      { label: "Hashtag", value: "#ACXchange" },
      { label: "Photo gallery", value: "Flickr — riacnetorg" },
    ],
    testimonials: [
      {
        quote: "Excellent practice in ecosystems of innovation, groups directed to entrepreneurship with private support.",
        name: "Tomás Domingo Guzmán Hernández",
        role: "Director, Innovation and Productive Development",
        organization: "Vice Ministry of National Competitiveness, Ministry of Economy",
        country: "Dominican Republic",
        theme: "Innovation ecosystems",
      },
      {
        quote: "I enjoyed absolutely everything — the exposure to all of the innovation, the interaction and sharing with participants, and the huge networking opportunities.",
        name: "Karen Eleanor St. Cyr",
        role: "Senior Lead Policy Advisor",
        organization: "Ministry of Education, Government of The Bahamas",
        country: "The Bahamas",
        theme: "Networking depth",
      },
      {
        quote: "Keep ACE working — it is a great help for countries like Ecuador. The interchange is awesome.",
        name: "Santiago León",
        role: "Minister of Industries and Productivity",
        organization: "Government of Ecuador",
        country: "Ecuador",
        theme: "Inter-country collaboration",
      },
      {
        quote: "The bus time provided opportunities to bond and have discussions with delegates about conditions in their countries, what they wanted to obtain from ACE, and potential opportunities for partnerships, collaboration and information sharing.",
        name: "Patricia (Trish) Kelly",
        role: "Managing Director",
        organization: "Valley Vision (Sacramento)",
        country: "United States",
        theme: "Bilateral connections",
      },
      {
        quote: "I go back to Argentina with 50 new inspiring friends. My sincere thanks to the organizing team — keep in touch!",
        name: "Juan Nascimbene",
        role: "Senior Advisor, Undersecretary of Foreign Trade",
        organization: "Government of Argentina",
        country: "Argentina",
        theme: "Cohort impact",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 11 — Puerto Rico (12 municipalities) · May 18–24, 2019.
    // Source: ACE-11-Final-Report.pdf (28 pp).
    // ──────────────────────────────────────────────────────────────────
    id: "ace-puerto-rico-2019",
    editionId: "ace-11-puerto-rico-2019",
    title: "ACE Puerto Rico 2019 — Final Report Intelligence",
    location: "Puerto Rico, United States",
    countryIds: ["us"],
    cityIds: ["city-san-juan"],
    dates: "May 18–24, 2019",
    sourcePdf: "/documents/ACE-11-Final-Report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Leaders", value: 46, hint: "Highly competitive selection process" },
      { label: "Countries represented", value: 19, hint: "17 Americas + 2 other regions + 3 international organizations" },
      { label: "Sites visited", value: 23 },
      { label: "Projects featured", value: 58, hint: "Across 12 municipalities of Puerto Rico" },
      { label: "Best practices demonstrated", value: "140+" },
      { label: "Collaboration opportunities", value: "140+", hint: "Catalyzed across the program" },
      { label: "Committed to gender & youth inclusion", value: "93%" },
    ],
    sectors: [
      {
        id: "sec-aerospace-pr",
        name: "Aerospace & Aviation",
        siteIds: [
          "Honeywell (Aguadilla)",
          "Lufthansa Technik",
          "United Technology Corporation",
          "US Coast Guard Air Station Borinquén",
          "Polytechnic University (engineering labs)",
        ],
      },
      {
        id: "sec-biotech-pharma-pr",
        name: "Biotech, Pharma & Medical Devices",
        siteIds: [
          "Amgen Puerto Rico",
          "Medtronic Caguas",
          "Molecular Sciences Research Center (UPR)",
          "Ponce Health Sciences R&D Center",
        ],
      },
      {
        id: "sec-entrepreneurship-pr",
        name: "Entrepreneurship & Innovation Ecosystem",
        siteIds: [
          "Parallel 18",
          "Colmena 66",
          "Engine 4",
          "Piloto 151",
          "Grupo Guayacán",
          "Advent-Morro Equity Partners",
          "Puerto Rico Science, Technology & Research Trust",
        ],
      },
      {
        id: "sec-agtech-pr",
        name: "AgTech & Food Sciences",
        siteIds: [
          "AgroInnova",
          "INTECO",
          "UPR Mayagüez Food Science Labs",
          "Café Lucero",
          "Bacardí Distillery",
        ],
      },
      {
        id: "sec-resilience-pr",
        name: "Disaster Recovery & Resilience",
        siteIds: [
          "Foundation for Puerto Rico",
          "El Yunque National Forest",
          "Roosevelt Roads (former naval base)",
          "La Finca",
        ],
      },
      {
        id: "sec-academia-pr",
        name: "Academic R&D",
        siteIds: [
          "University of Puerto Rico Mayagüez",
          "UPR Mayagüez Business School",
          "Polytechnic University",
          "Music Conservatory of San Juan",
          "Arecibo Observatory",
        ],
      },
    ],
    hostSites: [
      { name: "Bacardí Distillery", sectorId: "sec-agtech-pr", cityId: "city-san-juan" },
      { name: "Puerto Rico Convention Center", sectorId: "sec-entrepreneurship-pr", cityId: "city-san-juan" },
      { name: "Puerto Rico Science, Technology & Research Trust", sectorId: "sec-entrepreneurship-pr", cityId: "city-san-juan" },
      { name: "Parallel 18", sectorId: "sec-entrepreneurship-pr", cityId: "city-san-juan" },
      { name: "Colmena 66", sectorId: "sec-entrepreneurship-pr", cityId: "city-san-juan" },
      { name: "Foundation for Puerto Rico", sectorId: "sec-resilience-pr", cityId: "city-san-juan" },
      { name: "Engine 4 (Bayamón)", sectorId: "sec-entrepreneurship-pr" },
      { name: "Arecibo Observatory", sectorId: "sec-academia-pr" },
      { name: "Honeywell Aerospace (Aguadilla)", sectorId: "sec-aerospace-pr" },
      { name: "US Coast Guard Air Station Borinquén", sectorId: "sec-aerospace-pr" },
      { name: "UPR Mayagüez Food Science Labs", sectorId: "sec-agtech-pr" },
      { name: "UPR Mayagüez Business School", sectorId: "sec-academia-pr" },
      { name: "Café Lucero (Ponce)", sectorId: "sec-agtech-pr" },
      { name: "Serallés Castle (Ponce)", sectorId: "sec-resilience-pr" },
      { name: "INTECO + AgroInnova (Caguas)", sectorId: "sec-agtech-pr" },
      { name: "Medtronic Caguas", sectorId: "sec-biotech-pharma-pr" },
      { name: "Roosevelt Roads (Ceiba)", sectorId: "sec-resilience-pr" },
      { name: "El Yunque National Forest (Luquillo)", sectorId: "sec-resilience-pr" },
      { name: "Polytechnic University", sectorId: "sec-aerospace-pr", cityId: "city-san-juan" },
      { name: "Molecular Sciences Research Center (UPR)", sectorId: "sec-biotech-pharma-pr", cityId: "city-san-juan" },
    ],
    collaborations: [
      { label: "Total collaboration opportunities", count: 140 },
      { label: "Best practices demonstrated", count: 140 },
    ],
    partnerships: [
      // ACE 11 documents named cross-country leads in prose; not a categorical breakdown.
    ],
    knowledgeGain: [
      // ACE 11 doesn't include a pre/exit per-topic survey.
    ],
    feedback: [
      { label: "Committed to gender & youth inclusion", pct: 93 },
    ],
    mediaImpact: [
      { label: "Press articles", value: "13+", icon: "newspaper" },
      { label: "Hashtag", value: "#ACXchange · #ACEworks · #ACEdelivers" },
      { label: "Photo gallery", value: "Flickr — riacnetorg" },
      { label: "Video summaries per day", value: "YouTube — RIAC channel" },
    ],
    testimonials: [
      {
        quote:
          "Guatemala is developing initiatives on innovation and entrepreneurship. The exchange with leaders from across the Americas was invaluable in understanding what models we could replicate.",
        name: "José Ramón Lam",
        role: "Vice Minister",
        organization: "Ministry of Economy",
        country: "Guatemala",
        theme: "Replicable models",
      },
      {
        quote:
          "The Dominican Republic has been able to connect with other countries and learn from Puerto Rico's resilience after Hurricane María — a benchmark for our own recovery and infrastructure planning.",
        name: "ACE 11 delegate",
        role: "Innovation lead",
        country: "Dominican Republic",
        theme: "Resilience & recovery",
      },
      {
        quote:
          "It is an honor to participate in the 11th Americas Competitiveness Exchange, representing Jamaica's commitment to building our first national business incubator/accelerator.",
        name: "Floyd Green",
        role: "Minister of State",
        organization: "Ministry of Industry, Commerce, Agriculture & Fisheries",
        country: "Jamaica",
        theme: "Building national institutions",
      },
      {
        quote:
          "The Caribbean Climate Innovation Center is exploring a partnership with Lufthansa and Honeywell to facilitate exchange programs with Caribbean universities and companies — a direct outcome of ACE 11.",
        name: "Carlinton Burrell",
        role: "Chief Executive Officer",
        organization: "Caribbean Climate Innovation Center",
        country: "Jamaica",
        theme: "Aerospace & climate partnerships",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 14 — Louisiana (New Orleans, Baton Rouge, Lafayette, Acadiana)
    // March 26 – April 1, 2022. Source: ACE-luosiana-Final-Report (147 pp).
    // The richest of the older reports — full Impact Report format.
    // ──────────────────────────────────────────────────────────────────
    id: "ace-louisiana-2022",
    editionId: "ace-14-louisiana-2022",
    title: "ACE Louisiana 2022 — Final Report Intelligence",
    location: "Louisiana, United States",
    countryIds: ["us"],
    cityIds: ["city-new-orleans"],
    dates: "March 26 – April 1, 2022",
    sourcePdf: "/documents/ACE-Louisiana-Impact-Report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Participants", value: 55, hint: "28 women — 51% of the delegation" },
      { label: "Total leaders engaged", value: "100+", hint: "Participants, special guests, organizers, ACE Committee" },
      { label: "Speakers", value: "100+" },
      { label: "Special guests", value: 11 },
      { label: "Countries represented", value: 20, hint: "18 Americas + 2 other regions + 2 international organizations" },
      { label: "Sites & projects featured", value: "30+" },
      { label: "Survey response rate", value: "75%", hint: "41 of 55 participants responded" },
      { label: "Collaboration opportunities", value: "200+", hint: "Tracked, monitored and facilitated post-program" },
      { label: "Would recommend the program", value: "100%" },
      { label: "Committed to gender & youth inclusion", value: "100%" },
      { label: "Met expectations", value: "100%" },
      { label: "Exceeded or greatly exceeded expectations", value: "89%" },
    ],
    sectors: [
      {
        id: "sec-equity-la",
        name: "Equity, HBCUs & Inclusive Development",
        siteIds: [
          "Hispanic Chamber of Commerce of Louisiana (HCCL)",
          "El Centro",
          "White House Initiative on HBCUs",
          "Xavier University",
          "Dillard University",
          "Southern University",
        ],
      },
      {
        id: "sec-cultural-economy-la",
        name: "Cultural Economy & Tourism",
        siteIds: [
          "Mardi Gras World",
          "New Orleans & Co.",
          "Morial Convention Center",
          "Ashé Cultural Arts Center",
          "Dooky Chase Restaurant",
          "Claiborne Corridor Cultural Innovation District",
        ],
      },
      {
        id: "sec-logistics-ports-la",
        name: "Logistics, Ports & Trade",
        siteIds: [
          "Port of New Orleans",
          "Port of South Louisiana",
          "Port Fourchon",
          "Smart Port Initiative",
        ],
      },
      {
        id: "sec-energy-la",
        name: "Energy & Coastal Resilience",
        siteIds: [
          "Louisiana Coastal Protection & Restoration Authority",
          "LSU Coastal Research",
          "Louisiana Energy Sector",
        ],
      },
      {
        id: "sec-innovation-rd-la",
        name: "Innovation, R&D & SME Acceleration",
        siteIds: [
          "Louisiana Economic Development",
          "New Orleans BioFund",
          "Idea Village",
          "LSU AgCenter",
          "LA Tech Park (Lafayette)",
        ],
      },
      {
        id: "sec-aerospace-defense-la",
        name: "Aerospace, Defense & Advanced Manufacturing",
        siteIds: ["NASA Michoud Assembly Facility", "Acadiana Manufacturing Cluster"],
      },
    ],
    hostSites: [
      { name: "New Orleans BioFund", sectorId: "sec-innovation-rd-la", cityId: "city-new-orleans" },
      { name: "NASA Michoud Assembly Facility", sectorId: "sec-aerospace-defense-la", cityId: "city-new-orleans" },
      { name: "Mardi Gras World", sectorId: "sec-cultural-economy-la", cityId: "city-new-orleans" },
      { name: "Ashé Cultural Arts Center & Claiborne Corridor CID", sectorId: "sec-cultural-economy-la", cityId: "city-new-orleans" },
      { name: "Port of New Orleans", sectorId: "sec-logistics-ports-la", cityId: "city-new-orleans" },
      { name: "Port of South Louisiana / Port Fourchon", sectorId: "sec-logistics-ports-la" },
      { name: "Hispanic Chamber of Commerce of Louisiana (HCCL)", sectorId: "sec-equity-la", cityId: "city-new-orleans" },
      { name: "Xavier University of Louisiana", sectorId: "sec-equity-la", cityId: "city-new-orleans" },
      { name: "Dooky Chase Restaurant", sectorId: "sec-cultural-economy-la", cityId: "city-new-orleans" },
      { name: "Louisiana Economic Development (Baton Rouge)", sectorId: "sec-innovation-rd-la" },
      { name: "LSU Coastal Research (Baton Rouge)", sectorId: "sec-energy-la" },
      { name: "LSU AgCenter (Baton Rouge)", sectorId: "sec-innovation-rd-la" },
      { name: "Idea Village (Lafayette / New Orleans)", sectorId: "sec-innovation-rd-la" },
      { name: "Acadiana Manufacturing Cluster (Lafayette)", sectorId: "sec-aerospace-defense-la" },
      { name: "LA Tech Park (Lafayette)", sectorId: "sec-innovation-rd-la" },
    ],
    collaborations: [
      { label: "Total collaboration opportunities", count: 200 },
    ],
    partnerships: [
      // ACE 14 categorises leads as "with hosts" vs "with fellow participants"
      // (pages 119+) but does not publish a numeric breakdown by sector.
    ],
    knowledgeGain: [
      // ACE 14 reports "100% enhanced or will enhance capacities" qualitatively
      // rather than as a per-topic pre/exit comparison.
    ],
    feedback: [
      { label: "Met expectations", pct: 100 },
      { label: "Exceeded or greatly exceeded expectations", pct: 89 },
      { label: "Would recommend the program", pct: 100 },
      { label: "Committed to gender & youth inclusion", pct: 100 },
      { label: "Capacities enhanced or will be enhanced", pct: 100 },
    ],
    mediaImpact: [
      { label: "Press articles", value: "69+", icon: "newspaper" },
      { label: "Social media posts", value: "298+" },
      { label: "Tweets archived", value: "114+" },
      { label: "Hashtag", value: "#ACEinLouisiana · #ACXchange" },
    ],
    testimonials: [
      {
        quote:
          "Based on my participation in ACE, it reaffirms my belief that inclusivity is KEY — to get ALL of our creativity on the table to tackle the biggest global challenges.",
        name: "Paul Sohl",
        role: "Chief Executive Officer",
        organization: "Florida High Tech Corridor Council",
        country: "United States",
        theme: "Inclusive innovation",
      },
      {
        quote:
          "The approach to development being utilized in Louisiana is exemplary. A lot of lessons were learnt that I will be taking home to apply.",
        name: "Dr. Charah T. Watson",
        role: "Executive Director",
        organization: "Scientific Research Council",
        country: "Jamaica",
        theme: "Replicable models",
      },
      {
        quote:
          "ACE Louisiana made me realize that I am an important part of the change we need to create in the system to allow inclusion of underrepresented populations in economic development strategies.",
        name: "Mauricio Marques",
        role: "Superintendent",
        organization: "Funding Authority for Studies and Projects (FINEP)",
        country: "Brazil",
        theme: "Equity at scale",
      },
      {
        quote:
          "I was amazed by the resiliency of the people of Louisiana — how they have recovered from natural disasters and are growing not only as a tourist and event destination but as an entrepreneurial and innovation hub in the south of the United States.",
        name: "Alejandro Echeverri",
        role: "Investment Director",
        organization: "Colombian Government Trade Bureau (ProColombia)",
        country: "Colombia",
        theme: "Resilience & recovery",
      },
      {
        quote:
          "The programs about STEM minorities and gender-related were excellent. Fostering STEM fields for girls would be an excellent program for my University, which is well known for its inclusive and territorial outreach.",
        name: "Velia Govaere",
        role: "Head, Center of Observatory of Foreign Trade",
        organization: "Universidad Estatal a Distancia (UNED)",
        country: "Costa Rica",
        theme: "STEM equity",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 16 — Greater Seattle Region (Seattle, Snohomish, Pierce, Kitsap,
    // Kent) · May 14–19, 2023. Source: ACESeattle-Final-Report (67 pp).
    // ──────────────────────────────────────────────────────────────────
    id: "ace-seattle-2023",
    editionId: "ace-16-seattle-2023",
    title: "ACE Seattle 2023 — Final Report Intelligence",
    location: "Greater Seattle Region, Washington, United States",
    countryIds: ["us"],
    cityIds: ["city-seattle"],
    dates: "May 14–19, 2023",
    sourcePdf: "/documents/ACESeattle-Final-Report-Seattle.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Total leaders engaged", value: "80+", hint: "Participants, special guests, organizers, federal & multinational orgs" },
      { label: "Participants surveyed", value: 56, hint: "49 responded — 88% response rate" },
      { label: "Sites visited", value: "27+" },
      { label: "Collaboration opportunities", value: "710+", hint: "Trade, R&D, soft-landing, sister cities, business expansion" },
      { label: "Exceeded or greatly exceeded expectations", value: "100%" },
    ],
    sectors: [
      {
        id: "sec-ict-digital-sea",
        name: "ICT, Cloud & Digital Transformation",
        siteIds: [
          "Microsoft Redmond Campus",
          "Amazon HQ + AWS",
          "Amazon Spheres",
          "Global Innovation Exchange (GIX)",
        ],
      },
      {
        id: "sec-aerospace-sea",
        name: "Aerospace & Aviation",
        siteIds: [
          "Boeing Everett Factory",
          "Boeing Future of Flight",
          "Aviation Technical Services",
          "Museum of Flight",
          "Alaska Airlines",
          "Port of Seattle",
        ],
      },
      {
        id: "sec-maritime-ports-sea",
        name: "Maritime, Ports & Sustainable Trade",
        siteIds: [
          "Port of Everett",
          "Port of Tacoma",
          "Port of Bremerton",
          "SAFE Boats",
          "Maritime Blue",
          "WAV-C autonomous vehicle cluster",
        ],
      },
      {
        id: "sec-clean-energy-sea",
        name: "Clean Energy & Climate",
        siteIds: [
          "UW Clean Energy Institute",
          "Washington Clean Energy Testbeds",
          "Center for Urban Waters",
        ],
      },
      {
        id: "sec-life-sciences-sea",
        name: "Life Sciences & Global Health",
        siteIds: [
          "Fred Hutchinson Cancer Research Institute",
          "University of Washington-Seattle",
          "University of Washington-Tacoma",
        ],
      },
      {
        id: "sec-agtech-sea",
        name: "AgTech & Sustainable Agriculture",
        siteIds: ["Swan Trail Farms (5G Agricultural Field Lab)", "Chateau Ste. Michelle"],
      },
      {
        id: "sec-tribal-sea",
        name: "Tribal Economic Development",
        siteIds: ["Suquamish Port Madison Indian Reservation", "House of Awakened Culture"],
      },
      {
        id: "sec-cultural-sea",
        name: "Tourism, Arts & Cultural Economy",
        siteIds: [
          "Pike Place Market",
          "Wing Luke Museum",
          "Chihuly Glass Museum",
          "Museum of Glass",
          "Starbucks Center Complex",
        ],
      },
    ],
    hostSites: [
      { name: "Space Needle", sectorId: "sec-cultural-sea", cityId: "city-seattle" },
      { name: "Pike Place Market", sectorId: "sec-cultural-sea", cityId: "city-seattle" },
      { name: "Wing Luke Museum", sectorId: "sec-cultural-sea", cityId: "city-seattle" },
      { name: "University of Washington-Seattle (CoMotion + Clean Energy Institute)", sectorId: "sec-life-sciences-sea", cityId: "city-seattle" },
      { name: "Microsoft Redmond Campus", sectorId: "sec-ict-digital-sea" },
      { name: "Global Innovation Exchange (GIX) — Spring District", sectorId: "sec-ict-digital-sea" },
      { name: "Chateau Ste. Michelle", sectorId: "sec-agtech-sea" },
      { name: "Swan Trail Farms — 5G Agricultural Field Lab", sectorId: "sec-agtech-sea" },
      { name: "Port of Everett", sectorId: "sec-maritime-ports-sea" },
      { name: "Boeing Everett Factory", sectorId: "sec-aerospace-sea" },
      { name: "Aviation Technical Services (Paine Field)", sectorId: "sec-aerospace-sea" },
      { name: "Joint Base Lewis-McChord", sectorId: "sec-aerospace-sea" },
      { name: "Port of Tacoma", sectorId: "sec-maritime-ports-sea" },
      { name: "Center for Urban Waters (Tacoma)", sectorId: "sec-clean-energy-sea" },
      { name: "University of Washington-Tacoma", sectorId: "sec-life-sciences-sea" },
      { name: "Museum of Glass (Tacoma)", sectorId: "sec-cultural-sea" },
      { name: "SAFE Boats (Bremerton)", sectorId: "sec-maritime-ports-sea" },
      { name: "Port of Bremerton", sectorId: "sec-maritime-ports-sea" },
      { name: "Suquamish Port Madison Indian Reservation", sectorId: "sec-tribal-sea" },
      { name: "Alaska Airlines / Port of Seattle (sustainability panel)", sectorId: "sec-aerospace-sea", cityId: "city-seattle" },
      { name: "Fred Hutchinson Cancer Research Institute", sectorId: "sec-life-sciences-sea", cityId: "city-seattle" },
      { name: "Amazon HQ, AWS & Amazon Spheres", sectorId: "sec-ict-digital-sea", cityId: "city-seattle" },
      { name: "Starbucks Center Complex", sectorId: "sec-cultural-sea", cityId: "city-seattle" },
      { name: "Museum of Flight", sectorId: "sec-aerospace-sea", cityId: "city-seattle" },
      { name: "Chihuly Glass Museum", sectorId: "sec-cultural-sea", cityId: "city-seattle" },
    ],
    collaborations: [
      { label: "Total collaboration opportunities", count: 710 },
    ],
    partnerships: [
      // ACE 16 lists named partnership examples in "Top Results & Partnership
      // Opportunities" but does not publish a numeric category breakdown.
    ],
    knowledgeGain: [
      // ACE 16 reports knowledge uplift qualitatively in the Testimonials.
    ],
    feedback: [
      { label: "Exceeded or greatly exceeded expectations", pct: 100 },
    ],
    mediaImpact: [
      { label: "Press articles", value: "9+", icon: "newspaper" },
      { label: "Hashtag", value: "#ACXchange · #ACEinSeattle" },
      { label: "Video playlist", value: "YouTube — RIAC channel" },
      { label: "Photo gallery", value: "Flickr — riacnetorg" },
    ],
    testimonials: [
      {
        quote:
          "We are now part of the LAC Investment Initiative, made contact with the Water Program at Stillman College, connections to follow up on Starbucks Coffee Program in the LAC regions, and engaged the Innovation Cabinet in DR with the innovation cluster.",
        name: "Laura del Castillo",
        role: "Technical Director",
        organization: "National Competitiveness Council",
        country: "Dominican Republic",
        theme: "Multi-track partnerships",
      },
      {
        quote:
          "Potential project with Panama on sustainable agriculture; potential project with IEDC, Puget Sound Regional Council, Starbucks Foundation and the Pan American Development Foundation on resilient economy — transition to coffee from coca.",
        name: "Joe McKinney",
        role: "Executive Director",
        organization: "National Association of Development Organizations",
        country: "United States",
        theme: "Coca-to-coffee transition",
      },
      {
        quote:
          "Public-Private Partnership models were comprehensively presented during the visit. This model can work in many areas in Armenia. Was inspired by how educational institutions in Seattle were synergized with the economic development environment of the State.",
        name: "Artur Grigoryan",
        role: "Deputy Chief of Mission",
        organization: "Embassy of Armenia to the United States",
        country: "Armenia",
        theme: "PPP & academia synergy",
      },
      {
        quote:
          "ACE Seattle improved my knowledge of international economic development successes and challenges — especially around inclusive growth and how to scale R&D with anchor companies like Boeing, Microsoft, and Amazon.",
        name: "Bastian Almm",
        role: "Head of Division, Regional Economic & Structural Policy",
        organization: "Federal Ministry for Economic Affairs and Climate Action",
        country: "Germany",
        theme: "Anchor-company R&D",
      },
      {
        quote:
          "The 2023 Spring ACE program presented several opportunities to explore partnerships with Seattle area higher education institutions, corporate entities such as Microsoft, Starbucks, Boeing, and Amazon, and to develop student recruitment, faculty research, and study abroad programs.",
        name: "Leandra Hayes-Burgess",
        role: "Vice President for Institutional Advancement",
        organization: "Benedict College",
        country: "United States",
        theme: "HBCU global partnerships",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 1 — US Southeast (Atlanta GA, Greenville SC, Conover NC,
    // Kannapolis NC, Charlotte NC) · March 31 – April 4, 2014.
    // The original ACE. Source: ACE-1-Final-Report.pdf (34 pp).
    // ──────────────────────────────────────────────────────────────────
    id: "ace-southeast-2014",
    editionId: "ace-1-southeast-2014",
    title: "ACE Southeast 2014 — Final Report Intelligence",
    location: "Georgia, South Carolina & North Carolina, United States",
    countryIds: ["us"],
    cityIds: ["city-atlanta", "city-charlotte"],
    dates: "March 31 – April 4, 2014",
    sourcePdf: "/documents/ACE-1-Final-Report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Edition", value: "First", hint: "Inaugural ACE — established the program format" },
      { label: "Host cities", value: 5, hint: "Atlanta · Greenville · Conover · Kannapolis · Charlotte" },
      { label: "Women participation", value: "32%", hint: "Baseline for the gender-balance evolution" },
      { label: "Met expectations", value: "95%" },
      { label: "Exceeded expectations", value: "80%" },
      { label: "Would consider participating again", value: "95%" },
      { label: "Multinational character valued", value: "90%", hint: "Considered favorable to promote collaborations" },
    ],
    sectors: [
      {
        id: "sec-medical-rd-1",
        name: "Medical R&D & Health Innovation",
        siteIds: [
          "Global Center for Medical Innovation (GCMI)",
          "Health Enterprise Innovation Institute",
        ],
      },
      {
        id: "sec-incubators-1",
        name: "Incubators, Accelerators & Tech Transfer",
        siteIds: [
          "Advanced Technology Development Center (ATDC)",
          "VentureLab",
          "Packard Place",
          "EPIC / IDEAS Center (UNC Charlotte)",
        ],
      },
      {
        id: "sec-academia-1",
        name: "Research Universities",
        siteIds: [
          "Georgia Institute of Technology",
          "Clemson University CU-ICAR",
          "UNC Charlotte",
        ],
      },
      {
        id: "sec-automotive-1",
        name: "Automotive Engineering",
        siteIds: [
          "Clemson University International Center for Automotive Research (CU-ICAR)",
          "BMW Manufacturing (Greer)",
        ],
      },
      {
        id: "sec-manufacturing-1",
        name: "Advanced Manufacturing",
        siteIds: [
          "Manufacturing Solutions Center (Conover)",
          "Georgia Manufacturing Extension Partnership (GAMEP)",
        ],
      },
      {
        id: "sec-rd-campus-1",
        name: "Public-Private Research Campuses",
        siteIds: ["North Carolina Research Campus (Kannapolis)"],
      },
      {
        id: "sec-energy-restoration-1",
        name: "Energy & Restoration",
        siteIds: ["SCE&G Energy Innovation Center", "Clemson Restoration Institute"],
      },
    ],
    hostSites: [
      { name: "Metro Atlanta Chamber of Commerce", sectorId: "sec-incubators-1", cityId: "city-atlanta" },
      { name: "Global Center for Medical Innovation (GCMI)", sectorId: "sec-medical-rd-1", cityId: "city-atlanta" },
      { name: "Advanced Technology Development Center (ATDC)", sectorId: "sec-incubators-1", cityId: "city-atlanta" },
      { name: "VentureLab", sectorId: "sec-incubators-1", cityId: "city-atlanta" },
      { name: "Georgia Institute of Technology", sectorId: "sec-academia-1", cityId: "city-atlanta" },
      { name: "Clemson University CU-ICAR (Greenville)", sectorId: "sec-automotive-1" },
      { name: "BMW Manufacturing (Greer)", sectorId: "sec-automotive-1" },
      { name: "SCE&G Energy Innovation Center / Restoration Institute", sectorId: "sec-energy-restoration-1" },
      { name: "South Carolina Department of Commerce", sectorId: "sec-incubators-1" },
      { name: "Manufacturing Solutions Center (Conover)", sectorId: "sec-manufacturing-1" },
      { name: "North Carolina Research Campus (Kannapolis)", sectorId: "sec-rd-campus-1" },
      { name: "Packard Place (Charlotte)", sectorId: "sec-incubators-1", cityId: "city-charlotte" },
      { name: "EPIC / IDEAS Center, UNC Charlotte", sectorId: "sec-incubators-1", cityId: "city-charlotte" },
    ],
    collaborations: [
      // ACE 1 doesn't publish a numeric collaboration count — narrative only.
    ],
    partnerships: [
      // ACE 1 does not break partnerships into named categories.
    ],
    knowledgeGain: [
      // No pre/exit per-topic survey.
    ],
    feedback: [
      { label: "Met expectations", pct: 95 },
      { label: "Exceeded expectations", pct: 80 },
      { label: "Multinational mix valued favorable", pct: 90 },
      { label: "Would consider participating again", pct: 95 },
    ],
    mediaImpact: [
      { label: "Press releases tracked", value: "Multiple", icon: "newspaper" },
      { label: "Hashtag", value: "#ACXchange" },
      { label: "Photo gallery", value: "Flickr — riacnetorg" },
    ],
    testimonials: [
      {
        quote:
          "This activity has been tremendously useful. It has shown how each city, how each town has its own unique approach to building its business people, using innovation, using entrepreneurship to promote sustainable economic growth.",
        name: "Claudine Tracey",
        role: "General Manager of Strategic Services",
        organization: "Development Bank of Jamaica",
        country: "Jamaica",
        theme: "Local approaches to growth",
      },
      {
        quote:
          "This Exchange has really not just fulfilled, but exceeded my expectations. The quality of the presentations, the exposure to facilities, and the networking opportunities made it easy to understand within a week how best to transfer knowledge to your own nation.",
        name: "Anne Reid",
        role: "Chief Executive Officer",
        organization: "Barbados Private Sector Association",
        country: "Barbados",
        theme: "Public-private partnerships",
      },
      {
        quote:
          "The importance of STEM as part of the education curriculum from kindergarten to tertiary education, the transfer of technology from universities to the private sector, and the importance of developing entrepreneurs through incubators and business accelerators have been clearly demonstrated as pathways for successful economic growth.",
        name: "Dr. Rikhiraj Permanand",
        role: "Executive Director",
        organization: "Economic Development Board / Council for Competitiveness and Innovation",
        country: "Trinidad and Tobago",
        theme: "STEM & tech transfer",
      },
      {
        quote:
          "The exchange far exceeded our expectations as a vehicle for increasing the dialogue between the United States and Latin American and Caribbean countries — generating excitement, opportunities, and dialogue.",
        name: "Thomas Guevara",
        role: "Deputy Assistant Secretary for Regional Affairs",
        organization: "U.S. Department of Commerce, Economic Development Administration",
        country: "United States",
        theme: "Hemispheric dialogue",
      },
      {
        quote:
          "This kind of innovation and entrepreneurship diplomacy creates win-win solutions. All these experiences in the United States and the Americas have changed paradigms and ways of doing business in our countries.",
        name: "Sherry Tross",
        role: "Executive Secretary for Integral Development",
        organization: "Organization of American States",
        country: "OAS",
        theme: "Innovation diplomacy",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 8 — North-Central Florida (Orlando, Melbourne, Cape Canaveral,
    // Palm Coast, St. Augustine, Gainesville, Tallahassee) · December
    // 3-9, 2017. Source: ACE-8-Final-Report.pdf (40 pp).
    // ──────────────────────────────────────────────────────────────────
    id: "ace-florida-2017",
    editionId: "ace-8-florida-2017",
    title: "ACE Florida 2017 — Final Report Intelligence",
    location: "North-Central Florida, United States",
    countryIds: ["us"],
    cityIds: ["city-miami"],
    dates: "December 3–9, 2017",
    sourcePdf: "/documents/ACE-8-Final-Report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Leaders", value: 42, hint: "Selected from 225 applications across 44 countries" },
      { label: "Countries represented", value: 19, hint: "17 OAS Member States + 2 from outside the region" },
      { label: "Sites visited", value: "26+" },
      { label: "Projects featured", value: "40+" },
      { label: "Women participation", value: "57%", hint: "Best gender balance to date — 24 of 42 participants" },
      { label: "Entrepreneurs sponsored", value: 3, hint: "Second ACE to reserve scholarship slots for entrepreneurs" },
      { label: "New direct contacts initiated", value: "650+" },
      { label: "Collaboration opportunities registered", value: 207 },
      { label: "Would participate again", value: "100%" },
      { label: "Met institution's needs", value: "95%" },
      { label: "Increased knowledge in I&E concepts", value: "62%+" },
      { label: "Increased knowledge in disruptive technologies", value: "86%" },
      { label: "International contacts growth", value: "+20%", hint: "From 36% → 43% of network being international" },
    ],
    sectors: [
      {
        id: "sec-aerospace-fl",
        name: "Aerospace, Aviation & Space",
        siteIds: [
          "NASA Kennedy Space Center",
          "Florida Institute of Technology — FIT Aviation",
          "Center for Advanced Aero-Propulsion (Polysonic Wind Tunnel)",
          "Port Canaveral",
        ],
      },
      {
        id: "sec-simulation-fl",
        name: "Simulation, Defense & National Security",
        siteIds: [
          "Lockheed Martin Global & Training Logistics",
          "National Center for Simulation",
          "Walt Disney World (Innovation & Simulation Tech)",
        ],
      },
      {
        id: "sec-life-sciences-fl",
        name: "Life Sciences, Biotech & Medical",
        siteIds: [
          "Guidewell Innovation Center (Medical City)",
          "Sid Martin Biotech Incubator",
          "Ology Bioservices",
          "Veterans Health Administration",
        ],
      },
      {
        id: "sec-magnetics-fl",
        name: "Magnetics & Advanced Materials",
        siteIds: [
          "BRIDG (semiconductor advanced materials)",
          "National High Magnetic Field Laboratory (MagLab)",
          "FullScaleNANO",
        ],
      },
      {
        id: "sec-academia-fl",
        name: "Higher Education & Innovation Hubs",
        siteIds: [
          "University of Central Florida (UCF Labs)",
          "University of Florida — Innovation Square / Cade Museum",
          "Santa Fe College — Perry Center",
          "Florida A&M University",
          "Florida State University (Jim Moran School of Entrepreneurship)",
        ],
      },
      {
        id: "sec-tourism-fl",
        name: "Tourism, Hospitality & Cultural Economy",
        siteIds: [
          "Castillo de San Marcos",
          "St. Augustine Distillery",
          "Cape Canaveral Exploration Tower",
        ],
      },
      {
        id: "sec-resilience-fl",
        name: "Disaster Preparedness & Climate",
        siteIds: ["WeatherSTEM", "Weather Tiger", "Center for Ocean-Atmospheric Prediction Studies (COAPS)"],
      },
    ],
    hostSites: [
      { name: "Walt Disney World — Magic Kingdom (Innovation & Simulation)", sectorId: "sec-simulation-fl" },
      { name: "University of Central Florida (UCF Labs)", sectorId: "sec-academia-fl" },
      { name: "Lockheed Martin Global & Training Logistics", sectorId: "sec-simulation-fl" },
      { name: "Guidewell Innovation Center", sectorId: "sec-life-sciences-fl" },
      { name: "BRIDG (semiconductor advanced materials)", sectorId: "sec-magnetics-fl" },
      { name: "Florida Institute of Technology — FIT Aviation", sectorId: "sec-aerospace-fl" },
      { name: "Center for Advanced Manufacturing & Innovative Design (CAMID)", sectorId: "sec-magnetics-fl" },
      { name: "Larsen Motorsports", sectorId: "sec-aerospace-fl" },
      { name: "Port Canaveral", sectorId: "sec-aerospace-fl" },
      { name: "NASA Kennedy Space Center", sectorId: "sec-aerospace-fl" },
      { name: "SeaRay Boats (Palm Coast)", sectorId: "sec-magnetics-fl" },
      { name: "Castillo de San Marcos & St. Augustine Distillery", sectorId: "sec-tourism-fl" },
      { name: "University of Florida — New Engineering Building", sectorId: "sec-academia-fl" },
      { name: "Cade Museum for Creativity and Innovation", sectorId: "sec-academia-fl" },
      { name: "Santa Fe College — Perry Center for Emerging Technologies", sectorId: "sec-academia-fl" },
      { name: "UF Innovation Square + Sid Martin Biotech Incubator", sectorId: "sec-life-sciences-fl" },
      { name: "Florida A&M University", sectorId: "sec-academia-fl" },
      { name: "National High Magnetic Field Laboratory (MagLab)", sectorId: "sec-magnetics-fl" },
      { name: "Florida Center for Advanced Aero-Propulsion", sectorId: "sec-aerospace-fl" },
      { name: "Florida's Historic Capitol (Closing Ceremony)", sectorId: "sec-tourism-fl" },
    ],
    collaborations: [
      { label: "Total collaboration opportunities registered", count: 207 },
      { label: "New direct contacts initiated", count: 650 },
    ],
    partnerships: [
      // ACE 8 doesn't publish a categorical breakdown.
    ],
    knowledgeGain: [
      { topic: "Innovation & entrepreneurship concepts", prePct: 38, exitPct: 100 },
      { topic: "University-private sector best practices", prePct: 31, exitPct: 100 },
      { topic: "Workforce development through universities", prePct: 31, exitPct: 100 },
      { topic: "Disruptive technologies in Florida", prePct: 14, exitPct: 100 },
    ],
    feedback: [
      { label: "Would participate again", pct: 100 },
      { label: "Met institution's needs", pct: 95 },
      { label: "Increased knowledge in I&E concepts", pct: 62 },
      { label: "Increased knowledge in disruptive technologies", pct: 86 },
    ],
    mediaImpact: [
      { label: "Press articles tracked", value: "12+", icon: "newspaper" },
      { label: "Notable outlets", value: "Tallahassee Democrat · Florida Trend · El Colombiano · WTXL · WCJB" },
      { label: "Hashtag", value: "#ACXchange" },
      { label: "Photo & video", value: "Flickr + YouTube — riacnetorg" },
    ],
    testimonials: [
      {
        quote:
          "The ACE is an amazing opportunity to connect people, to build relationships, to establish partnerships and it all gets to building the inclusive development of our hemisphere.",
        name: "Kim Osborne",
        role: "Executive Secretary for Integral Development",
        organization: "Organization of American States",
        country: "OAS",
        theme: "Inclusive hemispheric development",
      },
      {
        quote:
          "Here we have had the chance to understand more about big companies that are very committed with innovation and entrepreneurship and small businesses — it's all about collaboration, new industries and universities.",
        name: "Sebastián Vidal",
        role: "Executive Director",
        organization: "Parallel18",
        country: "Puerto Rico",
        theme: "Cross-sector collaboration",
      },
      {
        quote:
          "It is a great opportunity for countries from across the southern hemisphere to come to the U.S. and see some of the best practices in U.S. economic development — and for U.S. practitioners to learn from some of the best practices from those countries.",
        name: "Dennis Alvord",
        role: "Deputy Assistant Secretary for Regional Affairs",
        organization: "U.S. Department of Commerce — EDA",
        country: "United States",
        theme: "Bilateral best practices",
      },
      {
        quote:
          "We expect participants accepted into the program to come with a plan and to realize results through the exchanges and the friendships that they establish. It is about knowing people, exchanging ideas, and applying those ideas when they return back home.",
        name: "Jon Austin",
        role: "Alternate Representative to the OAS",
        organization: "U.S. Department of State",
        country: "United States",
        theme: "Outcome-driven exchange",
      },
      {
        quote:
          "I thoroughly enjoyed the experience and I'm returning home with enthusiasm and motivation to share and be a part of initiatives to foster economic development — not only through Beltraide and my professional life, but also through support to my community.",
        name: "Shahera McKoy",
        role: "Manager of the Business Facilitation Unit",
        organization: "Belize Trade and Investment Development Service (BELTRAIDE)",
        country: "Belize",
        theme: "Renewed commitment",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 9 — Special Edition: Germany & Israel (Tel Aviv, Jerusalem,
    // Berlin, Dresden + Yavne, Caesarea, Hadera, Raanana, Rishon Le Zion)
    // June 24-29, 2018. First ACE outside the Americas. "Building Bridges".
    // Source: ACE-9-Final-Report.pdf (28 pp).
    // ──────────────────────────────────────────────────────────────────
    id: "ace-germany-israel-2018",
    editionId: "ace-9-germany-israel-2018",
    title: "ACE Germany & Israel 2018 — Final Report Intelligence",
    location: "Tel Aviv, Jerusalem, Berlin & Dresden",
    countryIds: ["de", "il"],
    cityIds: ["city-tel-aviv", "city-berlin"],
    dates: "June 24–29, 2018",
    sourcePdf: "/documents/ACE-9-Final-Report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Edition", value: "Special", hint: "First ACE outside the Americas — \"Building Bridges\"" },
      { label: "Leaders", value: 49, hint: "Selected from 169 applications across 34 countries" },
      { label: "Countries represented", value: 20, hint: "19 Americas + 1 outside the region + 3 international organizations" },
      { label: "Sites visited", value: "28+" },
      { label: "Projects featured", value: "40+" },
      { label: "Women participation", value: "55%", hint: "22 women leaders" },
      { label: "miTalent app downloads", value: 80, hint: "Custom multi-purpose program app" },
      { label: "Twitter posts archived", value: "100+" },
    ],
    sectors: [
      {
        id: "sec-cyber-security-9",
        name: "Cyber Security & Smart Cities (Israel)",
        siteIds: [
          "Israel Innovation Authority",
          "Innovation Lab (10 startups)",
          "Sanara Ventures",
        ],
      },
      {
        id: "sec-water-tech-9",
        name: "Water Technology & Desalination",
        siteIds: ["Hadera Desalination Plant — IDE Technologies"],
      },
      {
        id: "sec-precision-ag-9",
        name: "Precision Agriculture & AgTech",
        siteIds: [
          "Volcani Agricultural Center of Excellence",
          "SCR Cow Intelligence Solution",
        ],
      },
      {
        id: "sec-aerospace-defense-9",
        name: "Aerospace, Defense & UAV",
        siteIds: [
          "Aeronautics Ltd. (Yavne)",
          "German Aerospace Center (DLR)",
        ],
      },
      {
        id: "sec-coworking-9",
        name: "Coworking, Startup Networks & Hi-Tech",
        siteIds: [
          "Labs Tel Aviv",
          "Factory Berlin Görlitzer Park",
          "Airport City (Tel Aviv)",
        ],
      },
      {
        id: "sec-green-mobility-9",
        name: "Smart & Green Mobility",
        siteIds: [
          "EUREF-Campus Berlin",
          "Volkswagen Transparent Factory (Dresden)",
        ],
      },
      {
        id: "sec-fraunhofer-rd-9",
        name: "Applied R&D & Industrial Innovation",
        siteIds: [
          "Fraunhofer Campus Dresden",
          "Institute for Wood Technology (IHD) Dresden",
          "Federal Ministry of Economics and Energy",
        ],
      },
      {
        id: "sec-education-9",
        name: "Workforce & Education 4.0",
        siteIds: [
          "Berlin Education Center (ABB)",
          "Research Institute for Brewing and Malting Technology",
        ],
      },
    ],
    hostSites: [
      { name: "Israel Innovation Authority", sectorId: "sec-cyber-security-9", cityId: "city-tel-aviv" },
      { name: "Innovation Lab (10 Israeli startups)", sectorId: "sec-cyber-security-9", cityId: "city-tel-aviv" },
      { name: "Sanara Ventures (Technology Accelerator)", sectorId: "sec-cyber-security-9", cityId: "city-tel-aviv" },
      { name: "SCR Cow Intelligence Solution", sectorId: "sec-precision-ag-9" },
      { name: "Hadera Desalination Plant — IDE Technologies", sectorId: "sec-water-tech-9" },
      { name: "Labs Tel Aviv", sectorId: "sec-coworking-9", cityId: "city-tel-aviv" },
      { name: "Aeronautics Ltd. (Yavne)", sectorId: "sec-aerospace-defense-9" },
      { name: "Volcani Agricultural Center of Excellence (Rishon Le Zion)", sectorId: "sec-precision-ag-9" },
      { name: "Federal Ministry of Economics and Energy", sectorId: "sec-fraunhofer-rd-9", cityId: "city-berlin" },
      { name: "EUREF-Campus", sectorId: "sec-green-mobility-9", cityId: "city-berlin" },
      { name: "Factory Berlin Görlitzer Park (Crossborder Entrepreneurship)", sectorId: "sec-coworking-9", cityId: "city-berlin" },
      { name: "Institute for Wood Technology (IHD) Dresden", sectorId: "sec-fraunhofer-rd-9" },
      { name: "Volkswagen Transparent Factory (Dresden)", sectorId: "sec-green-mobility-9" },
      { name: "Fraunhofer Campus Dresden", sectorId: "sec-fraunhofer-rd-9" },
      { name: "German Aerospace Center (DLR) Berlin-Adlershof", sectorId: "sec-aerospace-defense-9", cityId: "city-berlin" },
      { name: "Berlin Education Center (ABB)", sectorId: "sec-education-9", cityId: "city-berlin" },
      { name: "Research Institute for Brewing and Malting Technology", sectorId: "sec-education-9", cityId: "city-berlin" },
    ],
    collaborations: [
      // ACE 9 reports outcomes qualitatively in testimonials and follow-up.
    ],
    partnerships: [
      // No categorical breakdown.
    ],
    knowledgeGain: [
      // ACE 9 does not include a per-topic pre/exit survey.
    ],
    feedback: [
      { label: "Exceeded expectations 100%", pct: 100, },
    ],
    mediaImpact: [
      { label: "Press articles tracked", value: "20+", icon: "newspaper" },
      { label: "Notable outlets", value: "BMWi (Germany) · Israel MFA · PM Netanyahu Office · DLR · Tribuna Israelita" },
      { label: "Twitter posts archived", value: "100+" },
      { label: "miTalent app", value: "80 downloads · 1,932 dashboard views" },
      { label: "Hashtag", value: "#ACXchange · #BuildingBridges" },
    ],
    testimonials: [
      {
        quote:
          "Dear ACE friends, congratulations for this amazing program — my expectations were exceeded 100%. We could not have better hosts. It is amazing to find many people in the world who share the same passion and also believe that entrepreneurs can change the world.",
        name: "Itzel Villa",
        role: "General Director of Entrepreneurship Programs and Financing",
        organization: "INADEM — Mexico's National Entrepreneurship Institute",
        country: "Mexico",
        theme: "Global entrepreneurial network",
      },
      {
        quote:
          "The part of the mission in Israel was extremely rich. We could see how innovation and entrepreneurship are in the DNA of the country and how public policies are well designed and implemented. In a short time, we have gained a global vision of the ecosystem.",
        name: "Jackline Conca",
        role: "Deputy Director of Innovation",
        organization: "Ministry of Industry, Foreign Trade and Services",
        country: "Brazil",
        theme: "Israel as innovation policy benchmark",
      },
      {
        quote:
          "The attention to detail in the Trip Book for the German portion of the event was amazing. The detailed information on every participant, company/organization visited, and presenter is proving very useful in making effective decisions and follow-up communication.",
        name: "Desmond Dougall",
        role: "Managing Director",
        organization: "GISCAD Limited",
        country: "Trinidad and Tobago",
        theme: "Programmatic depth",
      },
      {
        quote:
          "Loved the visit to the Transparent Factory of Volkswagen especially. Loved the day trip to Dresden. Good combination of educational, networking, culture, and fun. A great group and extremely well organized.",
        name: "Christian Gómez Jr.",
        role: "Senior Manager, Latin American Government Affairs",
        organization: "Walmart",
        country: "United States",
        theme: "German industrial innovation",
      },
      {
        quote:
          "I consider the ACE an excellent opportunity to know not only about the host countries but also about the representative delegates. The network in bus, or lunch time, between all of us is great.",
        name: "María Virginia Ávila",
        role: "Deputy Secretary of Foreign Affairs",
        organization: "Government of Tucumán",
        country: "Argentina",
        theme: "Delegate-to-delegate networking",
      },
    ],
  },
  {
    // ──────────────────────────────────────────────────────────────────
    // ACE 10 — Northern California (San Francisco, Silicon Valley,
    // Monterey Bay, Salinas, Fresno, Davis, Sacramento) · October 21-27,
    // 2018. Themes: improving health, feeding the world, maximizing
    // resources, fostering resiliency. Source: ACE-10-Final-Report.pdf
    // (39 pp). California is the 5th largest economy in the world.
    // ──────────────────────────────────────────────────────────────────
    id: "ace-northern-california-2018",
    editionId: "ace-10-northern-california-2018",
    title: "ACE Northern California 2018 — Final Report Intelligence",
    location: "Northern California, United States",
    countryIds: ["us"],
    cityIds: ["city-san-francisco"],
    dates: "October 21–27, 2018",
    sourcePdf: "/documents/ACE-10-Final-Report.pdf",
    verificationStatus: "extracted_from_report",
    kpis: [
      { label: "Leaders", value: 48, hint: "Selected from 200+ applications across 36 countries" },
      { label: "Countries represented", value: 23, hint: "20 OAS Member States + 3 outside + 3 international organizations" },
      { label: "Host cities & towns", value: 7, hint: "SF · Silicon Valley · Santa Cruz · Salinas · Fresno · Davis · Sacramento" },
      { label: "Projects featured", value: "40+" },
      { label: "New best practices demonstrated", value: "340+", hint: "Available for participants to implement" },
      { label: "Potential outcomes reported", value: "125+" },
      { label: "Women participation", value: "42%", hint: "20 women leaders from 12 countries" },
      { label: "Met or exceeded expectations", value: "97%" },
      { label: "Would recommend the program", value: "98%" },
      { label: "Committed to gender & youth inclusion", value: "93%" },
      { label: "Post-survey response rate", value: "88%", hint: "42 of 48 participants" },
    ],
    sectors: [
      {
        id: "sec-life-sciences-nc",
        name: "Life Sciences & Biotech",
        siteIds: [
          "QB3 — UCSF",
          "UC Berkeley Skydeck",
          "Nextbiotics",
          "Bayer Crop Science CoLaborator (West Sacramento)",
        ],
      },
      {
        id: "sec-aerospace-supercomputing-nc",
        name: "Aerospace & Supercomputing",
        siteIds: [
          "NASA Ames Research Center",
          "Future Flight Central",
          "NASA Advanced Supercomputing Facility",
        ],
      },
      {
        id: "sec-agtech-nc",
        name: "AgTech & Smart Agriculture",
        siteIds: [
          "National Steinbeck Center (Salinas Valley AgTech)",
          "Taylor Fresh Foods",
          "Hahn Estate",
          "Bowles Farming Company (Los Banos)",
          "Almond Orchard — Smart Mating Disruption",
          "UC Davis ANR",
        ],
      },
      {
        id: "sec-water-energy-nc",
        name: "Water, Energy & Tech",
        siteIds: [
          "WET Center — California State University, Fresno",
          "University Farm Laboratory (Fresno)",
        ],
      },
      {
        id: "sec-incubators-nc",
        name: "Incubators, Accelerators & Co-working",
        siteIds: [
          "The Vault",
          "Bitwise Industries",
          "PI Shop",
          "Urban Hive (Sacramento)",
          "Cisco Systems",
        ],
      },
      {
        id: "sec-academia-nc",
        name: "Higher Education & Research",
        siteIds: [
          "University of California (UC ANR)",
          "Seymour Marine Discovery Center — UC Santa Cruz",
          "California State University, Fresno",
          "California State University, Sacramento",
        ],
      },
      {
        id: "sec-policy-nc",
        name: "State Policy & Investment Promotion",
        siteIds: [
          "Leland Stanford Mansion State Historic Park",
          "Valley Vision",
          "City of Sacramento — Innovation Office",
        ],
      },
    ],
    hostSites: [
      { name: "The Vault (Innovation Ecosystem)", sectorId: "sec-incubators-nc", cityId: "city-san-francisco" },
      { name: "QB3 — UCSF (Life Sciences Hub)", sectorId: "sec-life-sciences-nc", cityId: "city-san-francisco" },
      { name: "UC Berkeley Skydeck", sectorId: "sec-life-sciences-nc" },
      { name: "Cisco Systems (Silicon Valley Discussion Panel)", sectorId: "sec-incubators-nc" },
      { name: "NASA Ames Research Center", sectorId: "sec-aerospace-supercomputing-nc" },
      { name: "Future Flight Central + NASA Advanced Supercomputing", sectorId: "sec-aerospace-supercomputing-nc" },
      { name: "Seymour Marine Discovery Center (UC Santa Cruz)", sectorId: "sec-academia-nc" },
      { name: "National Steinbeck Center (Salinas)", sectorId: "sec-agtech-nc" },
      { name: "Taylor Fresh Foods", sectorId: "sec-agtech-nc" },
      { name: "Hahn Estate", sectorId: "sec-agtech-nc" },
      { name: "Bowles Farming Company (Los Banos)", sectorId: "sec-agtech-nc" },
      { name: "WET Center — Cal State Fresno", sectorId: "sec-water-energy-nc" },
      { name: "Bitwise Industries (Fresno)", sectorId: "sec-incubators-nc" },
      { name: "PI Shop — Micro-factory", sectorId: "sec-incubators-nc" },
      { name: "Almond Orchard — Smart Mating Disruption", sectorId: "sec-agtech-nc" },
      { name: "Urban Hive (Sacramento)", sectorId: "sec-incubators-nc" },
      { name: "Leland Stanford Mansion State Historic Park", sectorId: "sec-policy-nc" },
      { name: "Bayer Crop Science CoLaborator (West Sacramento)", sectorId: "sec-life-sciences-nc" },
      { name: "California Museum (Closing Ceremony, Sacramento)", sectorId: "sec-policy-nc" },
    ],
    collaborations: [
      { label: "New best practices demonstrated", count: 340 },
      { label: "Potential outcomes reported", count: 125 },
    ],
    partnerships: [
      // ACE 10 doesn't break partnerships into named categories.
    ],
    knowledgeGain: [
      // ACE 10 reports knowledge uplift qualitatively, not per-topic.
    ],
    feedback: [
      { label: "Met or exceeded expectations", pct: 97 },
      { label: "Would recommend the program", pct: 98 },
      { label: "Committed to gender & youth inclusion", pct: 93 },
    ],
    mediaImpact: [
      { label: "Press articles tracked", value: "Multiple", icon: "newspaper" },
      { label: "Hashtag", value: "#ACXchange · #ACE10" },
      { label: "Photo & video", value: "Flickr + YouTube — riacnetorg" },
      { label: "Themes featured", value: "Improving health · Feeding the world · Maximizing resources · Fostering resiliency" },
    ],
    testimonials: [
      {
        quote:
          "After this program, we are going to work more collaboratively together with organizations like OAS and others in the region to increase collaboration among the nations.",
        name: "Brian Lenihan",
        role: "Executive Director",
        organization: "SelectUSA — U.S. Department of Commerce",
        country: "United States",
        theme: "Increased hemispheric collaboration",
      },
      {
        quote:
          "You are doing an amazing job with this program. ACE is life-changing — not just for the persons involved, but for entire countries and regions. ACE is changing the world.",
        name: "Dennell Florius",
        role: "Entrepreneur",
        organization: "EcoCarib Inc.",
        country: "Saint Lucia",
        theme: "Programmatic impact",
      },
      {
        quote:
          "The environment you created for participants' integration to find collaboration opportunities is fantastic. Thank you.",
        name: "Celio Vaz",
        role: "President",
        organization: "Orbital Engenharia S.A.",
        country: "Brazil",
        theme: "Network design",
      },
      {
        quote:
          "Thanks to the whole team from the US and the OAS for the outstanding program and quality of the conversations and guests. Very impressive.",
        name: "Anderson Cumberbatch",
        role: "Chief Business Development Adviser",
        organization: "Ministry of Small Business, Entrepreneurship, and Commerce",
        country: "Barbados",
        theme: "Programmatic excellence",
      },
      {
        quote:
          "It is an awesome experience. We are grateful for the great job done by every sponsor, including the California Team.",
        name: "Velia Govaere",
        role: "Coordinator, Observatory of Foreign Trade",
        organization: "Universidad Estatal a Distancia (UNED)",
        country: "Costa Rica",
        theme: "Local hospitality",
      },
    ],
  },
];

export const reportById = (id: string) => reports.find(r => r.id === id);
export const reportsByEdition = (editionId: string) =>
  reports.filter(r => r.editionId === editionId);
