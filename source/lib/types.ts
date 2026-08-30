export type Member = {
  id: string;
  name: string;
  role: string;
  age: string;
  occupation: string;
  notes: string;
};

export type Family = {
  id: string;
  label: string;
  location: string;
  members: Member[];
  photos: string[];
  protocol: string;
  memos: string;
  meetingUpdatedAt?: string;
};

import type { ScenarioLabScenario, VideoBundle } from "./scenario-lab-types";

export type GeneratedScenario = ScenarioLabScenario;

export type ExperienceResponse = {
  id: string;
  familyId: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  scenarioId: string;
  choice: "A" | "B" | "C" | "Other";
  choiceLabel: string;
  decisionTimeMs: number;
  thirdOption: string;
  difficulty: number;
  rationale: string;
  createdAt: string;
};

export type WishCard = {
  id: string;
  summary: string;
  quote: string;
  familyId: string;
  requester: string;
  role: string;
  interviewDate: string;
  imageUrl: string;
  imageStatus?: "idle" | "queued" | "generating" | "failed";
  imageTaskId?: string;
};

export type ProjectData = {
  id: string;
  name: string;
  families: Family[];
  generatedScenarios: GeneratedScenario[];
  labScenarios: GeneratedScenario[];
  scenarioLabBundles: VideoBundle[];
  responses: ExperienceResponse[];
  wishCards: WishCard[];
  updatedAt: string;
};

export * from "./scenario-lab-types";

export type ProjectWorkspace = {
  activeProjectId: string;
  projects: ProjectData[];
};
