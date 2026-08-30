"use client";

import { createClient, type RealtimeChannel, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { ExperienceResponse } from "./types";

const PENDING_KEY = "inattentive-robot.pending-responses.v1";

type ResponseRow = {
  id: string;
  project_id: string;
  family_id: string;
  member_id: string;
  member_name: string;
  member_role: string;
  scenario_id: string;
  choice: ExperienceResponse["choice"];
  choice_label: string;
  decision_time_ms: number;
  third_option: string;
  difficulty: number;
  rationale: string;
  created_at: string;
};

export type QueuedResponse = { projectId: string; response: ExperienceResponse };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const cloudResponsesConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const responseCloud: SupabaseClient | null = cloudResponsesConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "inattentive-robot.researcher-auth.v1",
      },
    })
  : null;

function toRow(projectId: string, response: ExperienceResponse): ResponseRow {
  return {
    id: response.id,
    project_id: projectId,
    family_id: response.familyId,
    member_id: response.memberId,
    member_name: response.memberName,
    member_role: response.memberRole,
    scenario_id: response.scenarioId,
    choice: response.choice,
    choice_label: response.choiceLabel,
    decision_time_ms: response.decisionTimeMs,
    third_option: response.thirdOption,
    difficulty: response.difficulty,
    rationale: response.rationale,
    created_at: response.createdAt,
  };
}

function fromRow(row: ResponseRow): ExperienceResponse {
  return {
    id: row.id,
    familyId: row.family_id,
    memberId: row.member_id,
    memberName: row.member_name,
    memberRole: row.member_role,
    scenarioId: row.scenario_id,
    choice: row.choice,
    choiceLabel: row.choice_label,
    decisionTimeMs: row.decision_time_ms,
    thirdOption: row.third_option,
    difficulty: row.difficulty,
    rationale: row.rationale,
    createdAt: row.created_at,
  };
}

function pendingResponses(): QueuedResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PENDING_KEY) || "[]") as QueuedResponse[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePending(items: QueuedResponse[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

export function queueResponse(projectId: string, response: ExperienceResponse) {
  const current = pendingResponses();
  if (!current.some((item) => item.response.id === response.id)) current.push({ projectId, response });
  writePending(current);
}

export function pendingResponseCount() {
  return pendingResponses().length;
}

export async function submitCloudResponse(projectId: string, response: ExperienceResponse) {
  if (!responseCloud) {
    queueResponse(projectId, response);
    return { queued: true };
  }
  try {
    const { error } = await responseCloud.from("experience_responses").upsert(toRow(projectId, response), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
    writePending(pendingResponses().filter((item) => item.response.id !== response.id));
    return { queued: false };
  } catch (reason) {
    queueResponse(projectId, response);
    return { queued: true, error: reason instanceof Error ? reason.message : "Cloud submission failed." };
  }
}

export async function flushQueuedResponses() {
  if (!responseCloud) return pendingResponseCount();
  const queue = pendingResponses();
  const remaining: QueuedResponse[] = [];
  for (const item of queue) {
    try {
      const { error } = await responseCloud.from("experience_responses").upsert(toRow(item.projectId, item.response), { onConflict: "id", ignoreDuplicates: true });
      if (error) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  writePending(remaining);
  return remaining.length;
}

export async function fetchCloudResponses(projectId: string) {
  if (!responseCloud) return [];
  const { data, error } = await responseCloud
    .from("experience_responses")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ResponseRow[]).map(fromRow);
}

export function subscribeToCloudResponses(projectId: string, onInsert: (response: ExperienceResponse) => void): RealtimeChannel | null {
  if (!responseCloud) return null;
  return responseCloud
    .channel(`experience-responses-${projectId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "experience_responses", filter: `project_id=eq.${projectId}` },
      (payload) => onInsert(fromRow(payload.new as ResponseRow)),
    )
    .subscribe();
}

export async function currentResearcherSession(): Promise<Session | null> {
  if (!responseCloud) return null;
  const { data } = await responseCloud.auth.getSession();
  return data.session;
}

export async function signInResearcher(email: string, password: string) {
  if (!responseCloud) throw new Error("Supabase is not configured for this build.");
  const { data, error } = await responseCloud.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOutResearcher() {
  if (!responseCloud) return;
  const { error } = await responseCloud.auth.signOut();
  if (error) throw error;
}
