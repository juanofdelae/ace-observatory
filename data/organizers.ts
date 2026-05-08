import type { Organizer } from "@/types";

// Organizer entities referenced by editions.ts.
// Real people/teams from /memphis-profiles/.../organizers.json where relevant.
export const organizers: Organizer[] = [
  { id: "org-oas-1", name: "Organization of American States", role: "Program owner", organization: "OAS — Department of Economic Development" },
  { id: "org-oas-team", name: "ACE Team — OAS", role: "Program coordination", organization: "OAS" },
  { id: "org-edge", name: "Economic Development Growth Engine (EDGE)", role: "Local host", organization: "City of Memphis" },
  { id: "org-iec", name: "Innovation Exchange Coalition (IEC)", role: "Local host", organization: "Memphis" },
  { id: "org-us-dept-commerce", name: "U.S. Department of Commerce — EDA", role: "US government partner", organization: "U.S. Department of Commerce" },
  { id: "org-edc", name: "Economic Development Councils", role: "Regional coordinators", organization: "Multi-state partnership" },
  { id: "org-cordoba-cluster", name: "Córdoba Tech Cluster", role: "Host cluster", organization: "Córdoba, Argentina" },
  { id: "org-corfo", name: "CORFO", role: "Host agency", organization: "Government of Chile" },
];

// Real people from the Memphis 2026 organizer roster (OAS team).
export const oasCoreTeam: Organizer[] = [
  { id: "oas-barbara-kotschwar", name: "Barbara Kotschwar", role: "Director, Department of Economic Development", organization: "OAS" },
  { id: "oas-cesar-parga", name: "César Parga", role: "Chief, Competitiveness, Innovation & Technology Section", organization: "OAS" },
  { id: "oas-cristina-solis", name: "Cristina Solís", role: "ACE Coordinator", organization: "OAS" },
  { id: "oas-effy-gomez", name: "Effy Gómez", role: "ACE Program Officer", organization: "OAS" },
  { id: "oas-juansebastian-fonseca", name: "Juan Sebastián Fonseca", role: "Multimedia Designer — ACE", organization: "OAS" },
];

export const organizerById = (id: string) => organizers.find(o => o.id === id) || oasCoreTeam.find(o => o.id === id);
