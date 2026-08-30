"use client";

import { family002, family01Members, initialWorkspaceData, tutorialFamily } from "./seed-data";
import { normalizeScenario, scenarioOne } from "./scenario-lab";
import type { ProjectData, ProjectWorkspace } from "./types";

export interface ProjectStorageAdapter {
  load(): ProjectWorkspace;
  save(data: ProjectWorkspace): void;
  reset(): ProjectWorkspace;
}

const STORAGE_KEY = "inattentive-robot.platform.v3";
const PREVIOUS_STORAGE_KEY = "inattentive-robot.platform.v2";
const LEGACY_STORAGE_KEY = "inattentive-robot.platform.v1";

function freshSeed(): ProjectWorkspace {
  return structuredClone(initialWorkspaceData);
}

const family01LegacyRoles: Record<string, string> = {
  "mei-lin": "Mother",
  "lin-xia": "Grandmother",
  "alex-chen": "Younger Sister",
  "daniel-chen": "Older Sister's Partner",
};

function familyRoleForLegacyMember(memberId: string, memberRole: string) {
  return family01LegacyRoles[memberId] || family01Members.find((member) => member.role === memberRole)?.role || memberRole;
}

export function migrateProjectData(project: ProjectData): ProjectData {
  const fallbackFamilyId = project.families?.[0]?.id || "F-001";
  const labScenarios = Array.isArray(project.labScenarios) && project.labScenarios.length
    ? project.labScenarios.map((scenario) => normalizeScenario(scenario, fallbackFamilyId))
    : [scenarioOne()];
  const storedFamilies = Array.isArray(project.families) ? project.families : [];
  const formerFamily002 = storedFamilies.some((family) => family.id === "F-002" && (
    family.label.includes("test scenarios") || family.members?.some((member) => member.id === "test-participant")
  ));
  const migratedFamilies = storedFamilies.map((family) => {
      if (family.id === tutorialFamily.id) return { ...family, label: tutorialFamily.label, members: structuredClone(tutorialFamily.members) };
      if (family.id === "F-001") return { ...family, label: "Family 01", members: structuredClone(family01Members) };
      if (formerFamily002 && family.id === "F-002") return {
        ...family,
        id: "F-003",
        label: "Family 003 (test scenarios)",
        members: family.members?.length ? family.members : [
          { id: "test-participant", name: "Test Participant", role: "Participant", age: "", occupation: "", notes: "Participant profile for testing interactive scenarios." },
        ],
      };
      return family;
    });
  const storedTutorial = migratedFamilies.find((family) => family.id === tutorialFamily.id);
  const storedFamily002 = migratedFamilies.find((family) => family.id === family002.id);
  const familiesWithoutPinnedEntries = migratedFamilies.filter((family) => family.id !== tutorialFamily.id && family.id !== family002.id);
  const family001Index = familiesWithoutPinnedEntries.findIndex((family) => family.id === "F-001");
  familiesWithoutPinnedEntries.splice(family001Index + 1, 0, storedFamily002 ?? structuredClone(family002));
  const families = [storedTutorial ?? structuredClone(tutorialFamily), ...familiesWithoutPinnedEntries];
  const remapFormerFamily002 = <T extends { familyId: string }>(item: T): T => (
    formerFamily002 && item.familyId === "F-002" ? { ...item, familyId: "F-003" } : item
  );
  return {
    ...project,
    families,
    generatedScenarios: Array.isArray(project.generatedScenarios)
      ? project.generatedScenarios.map((scenario) => remapFormerFamily002(normalizeScenario(scenario, fallbackFamilyId)))
      : [],
    labScenarios: labScenarios.map(remapFormerFamily002),
    scenarioLabBundles: Array.isArray(project.scenarioLabBundles) ? project.scenarioLabBundles.map(remapFormerFamily002) : [],
    responses: Array.isArray(project.responses) ? project.responses.filter((response) => !response.id.startsWith("seed-")).map(remapFormerFamily002).map((response) => {
      if (response.familyId !== "F-001") return response;
      const role = familyRoleForLegacyMember(response.memberId, response.memberRole);
      const member = family01Members.find((item) => item.role === role);
      return { ...response, memberId: member?.id || response.memberId, memberName: role, memberRole: role, choiceLabel: response.choiceLabel.replace(/^.*?\s\/\s/, "") };
    }) : [],
    wishCards: Array.isArray(project.wishCards) ? project.wishCards.map(remapFormerFamily002).map((card) => {
      if (card.familyId !== "F-001") return card;
      const requester = card.requester === "Mei Lin" ? "Mother" : card.requester === "Alex Chen" ? "Younger Sister" : card.requester;
      return { ...card, requester, role: card.role === "Child" ? "Younger Sister" : card.role };
    }) : [],
  };
}

export function migrateWorkspaceData(parsed: ProjectWorkspace): ProjectWorkspace {
  const projects = Array.isArray(parsed.projects) ? parsed.projects.map(migrateProjectData) : [];
  if (!projects.length) return freshSeed();
  const activeProjectId = projects.some((project) => project.id === parsed.activeProjectId)
    ? parsed.activeProjectId
    : projects[0].id;
  return { activeProjectId, projects };
}

export class BrowserProjectStorage implements ProjectStorageAdapter {
  load(): ProjectWorkspace {
    if (typeof window === "undefined") return freshSeed();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ProjectWorkspace;
        if (Array.isArray(parsed.projects) && parsed.projects.length) {
          return migrateWorkspaceData(parsed);
        }
      } catch {
        return freshSeed();
      }
    }

    const previous = window.localStorage.getItem(PREVIOUS_STORAGE_KEY);
    if (previous) {
      try {
        const parsed = JSON.parse(previous) as ProjectWorkspace;
        if (Array.isArray(parsed.projects) && parsed.projects.length) return migrateWorkspaceData(parsed);
      } catch {
        // Fall through to the v1 migration.
      }
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return freshSeed();
    try {
      const project = JSON.parse(legacy) as ProjectData;
      return project.id ? migrateWorkspaceData({ activeProjectId: project.id, projects: [project] }) : freshSeed();
    } catch {
      return freshSeed();
    }
  }

  save(data: ProjectWorkspace) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        projects: data.projects.map((project) => (
          project.id === data.activeProjectId ? { ...project, updatedAt: new Date().toISOString() } : project
        )),
      }),
    );
  }

  reset() {
    const seed = freshSeed();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
    return seed;
  }
}

export const projectStorage = new BrowserProjectStorage();
