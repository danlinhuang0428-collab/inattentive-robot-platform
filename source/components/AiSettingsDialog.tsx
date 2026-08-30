"use client";

import { useEffect, useState } from "react";

type Status = {
  openRouter?: { configured?: boolean; fastModel?: string; complexModel?: string };
  fal?: { configured?: boolean; imageFastModel?: string; imageReferenceModel?: string; finalVideoModel?: string; videoQaModel?: string };
};

export default function AiSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<Status>({});
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [falKey, setFalKey] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/ai/settings", { cache: "no-store" }).then((response) => response.json()).then(setStatus).catch(() => setStatus({}));
  }, [open]);

  function close() {
    setState("idle"); setError(""); setOpenRouterKey(""); setFalKey("");
    onClose();
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setState("saving"); setError("");
    try {
      const response = await fetch("/__local-settings/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openRouterKey, falKey }) });
      const payload = await response.json() as { saved?: boolean; error?: string };
      if (!response.ok || !payload.saved) throw new Error(payload.error || "Could not save API settings.");
      window.setTimeout(() => window.location.reload(), 250);
    } catch (caught) {
      setState("error"); setError(caught instanceof Error ? caught.message : "Could not save API settings.");
    }
  }

  if (!open) return null;
  return <div className="local-key-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <form className="local-key-dialog glass-panel ai-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title" onSubmit={save}>
      <div><p className="eyebrow">LOCAL API SETTINGS</p><h2 id="ai-settings-title">Connect the AI pipeline</h2><p>Paste keys here. They are written only to this computer’s private <code>.env.local</code>, removed from the form immediately, and never stored in browser project data. Leave an already-connected field blank to keep its current key.</p></div>
      <label><span>OPENROUTER API KEY · {status.openRouter?.configured ? "CONNECTED" : "REQUIRED"}</span><input type="password" value={openRouterKey} onChange={(event) => setOpenRouterKey(event.target.value)} autoComplete="new-password" spellCheck={false} placeholder="sk-or-v1-…" /></label>
      <div className="key-model-row"><span>TEXT ROUTING</span><b>{status.openRouter?.fastModel || "Gemini Flash-Lite"} · {status.openRouter?.complexModel || "Gemini Flash"}</b></div>
      <label><span>FAL.AI API KEY · {status.fal?.configured ? "CONNECTED" : "REQUIRED"}</span><input type="password" value={falKey} onChange={(event) => setFalKey(event.target.value)} autoComplete="new-password" spellCheck={false} placeholder="fal key…" /></label>
      <div className="key-model-row"><span>MEDIA ROUTING</span><b>FLUX Schnell · Nano Banana 2 · MiniMax H3</b></div>
      {state === "error" && <p className="inline-error">{error}</p>}
      <footer><button type="button" onClick={close} disabled={state === "saving"}>Cancel</button><button type="submit" disabled={state === "saving" || (!openRouterKey.trim() && !falKey.trim())}>{state === "saving" ? "Saving securely…" : "Save settings"}</button></footer>
    </form>
  </div>;
}
