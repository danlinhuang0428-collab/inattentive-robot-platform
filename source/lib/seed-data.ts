import type { ProjectData, ProjectWorkspace } from "./types";
import { scenarioOne } from "./scenario-lab";

export const family01Members = [
  { id: "mother", name: "Mother", role: "Mother", age: "", occupation: "", notes: "Coordinates household routines and care decisions." },
  { id: "grandmother", name: "Grandmother", role: "Grandmother", age: "", occupation: "", notes: "May need support with mobility and daily routines." },
  { id: "older-sister", name: "Older Sister", role: "Older Sister", age: "", occupation: "", notes: "Can update the family protocol and helps coordinate care." },
  { id: "cousin", name: "Cousin", role: "Cousin", age: "", occupation: "", notes: "Lives with or regularly participates in the household." },
  { id: "younger-sister", name: "Younger Sister", role: "Younger Sister", age: "", occupation: "", notes: "A younger member of the household." },
  { id: "older-sisters-partner", name: "Older Sister's Partner", role: "Older Sister's Partner", age: "", occupation: "", notes: "The older sister's partner and a member of the household." },
];

export const tutorialFamily = {
  id: "TUTORIAL",
  label: "Tutorial",
  location: "",
  photos: [],
  protocol: "",
  memos: "",
  members: [
    { id: "tutorial-participant", name: "Participant", role: "Participant", age: "", occupation: "", notes: "Participant profile for the interactive tutorial." },
  ],
};

export const family002 = {
  id: "F-002",
  label: "Family 002",
  location: "",
  photos: [],
  protocol: "",
  memos: "",
  members: [
    { id: "yu-yan", name: "于燕", role: "Mother", age: "", occupation: "", notes: "" },
    { id: "fang-shu", name: "方树", role: "Child", age: "", occupation: "", notes: "" },
    { id: "father", name: "Father", role: "Father", age: "", occupation: "", notes: "" },
    { id: "researcher", name: "Researcher", role: "Researcher", age: "", occupation: "", notes: "" },
  ],
};

export const initialProjectData: ProjectData = {
  id: "inattentive-robot",
  name: "Inattentive Robot",
  updatedAt: "2026-08-14T00:00:00.000Z",
  families: [
    tutorialFamily,
    {
      id: "F-001",
      label: "Family 01",
      location: "Shanghai",
      photos: [],
      protocol:
        "1. Attend first to risks that may become irreversible within seconds.\n2. Check whether a person is physically safe before protecting objects.\n3. Explain delayed attention when two requests cannot be served at once.",
      memos:
        "The family repeatedly used the phrase “tell us what you noticed.” They expect the robot to account for what it did not attend to, not only what it chose.",
      meetingUpdatedAt: "2026-07-24T14:30:00.000Z",
      members: family01Members,
    },
    {
      ...family002,
    },
    {
      id: "F-003",
      label: "Family 003 (test scenarios)",
      location: "Ningde",
      photos: [],
      protocol: "",
      memos: "",
      members: [
        { id: "test-participant", name: "Test Participant", role: "Participant", age: "", occupation: "", notes: "Participant profile for testing interactive scenarios." },
      ],
    },
  ],
  generatedScenarios: [],
  labScenarios: [scenarioOne()],
  scenarioLabBundles: [],
  responses: [],
  wishCards: [
    { id: "wish-1", summary: "Help with homework", quote: "I hope it can explain the difficult parts without making me feel rushed.", familyId: "F-001", requester: "Younger Sister", role: "Younger Sister", interviewDate: "24 Jul 2026", imageUrl: "/case-shop/homework.jpg" },
    { id: "wish-2", summary: "Cook alongside me", quote: "Not take over—just notice when my hands are already full.", familyId: "F-001", requester: "Mother", role: "Mother", interviewDate: "24 Jul 2026", imageUrl: "/case-shop/cooking.jpg" },
    { id: "wish-3", summary: "Fold the laundry", quote: "We could do it together and talk about the day.", familyId: "F-003", requester: "Jing", role: "Grandmother", interviewDate: "02 Aug 2026", imageUrl: "/case-shop/laundry.jpg" },
    { id: "wish-4", summary: "Keep me company", quote: "Sometimes I only want someone to sit nearby and listen.", familyId: "F-003", requester: "Wei", role: "Father", interviewDate: "02 Aug 2026", imageUrl: "/case-shop/companionship.jpg" },
    { id: "wish-5", summary: "Tidy the play area", quote: "Put the toys away without losing where each game was left.", familyId: "F-001", requester: "Mother", role: "Mother", interviewDate: "24 Jul 2026", imageUrl: "/case-shop/tidy-toys.jpg" },
  ],
};

export function createBlankProject(name: string): ProjectData {
  const stamp = Date.now();
  return {
    id: `project-${stamp}`,
    name: name.trim() || "Untitled Project",
    updatedAt: new Date().toISOString(),
    families: [
      structuredClone(tutorialFamily),
      {
        id: "F-001",
        label: "Family 01",
        location: "",
        photos: [],
        protocol: "",
        memos: "",
        members: structuredClone(family01Members),
      },
      structuredClone(family002),
    ],
    generatedScenarios: [],
    labScenarios: [scenarioOne()],
    scenarioLabBundles: [],
    responses: [],
    wishCards: [],
  };
}

export const initialWorkspaceData: ProjectWorkspace = {
  activeProjectId: initialProjectData.id,
  projects: [initialProjectData],
};
