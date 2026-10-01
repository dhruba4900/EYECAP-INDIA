"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save, Sparkles } from "lucide-react";
import EyewearViewer from "@/components/3d/EyewearViewer";
import { defaultGraphicsConfig, type GraphicsConfig } from "@/lib/graphics";

type Revision = { id: string; version: number; createdAt: string };

const fieldClass = "w-full rounded-lg border border-[#252a37] bg-[#10131c] px-3 py-2 text-sm text-white outline-none focus:border-purple-500";

export default function GraphicsEditorPage() {
  const [draft, setDraft] = useState<GraphicsConfig>(defaultGraphicsConfig);
  const [version, setVersion] = useState(1);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/graphics")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load graphics settings");
        setDraft(data.draft);
        setVersion(data.version);
        setRevisions(data.revisions);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const saveDraft = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/graphics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save graphics draft");
      setMessage("Draft saved. Preview it here, then publish when ready.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save graphics draft");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    if (!await saveDraft()) {
      setPublishing(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/graphics", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to publish graphics settings");
      setVersion(data.version);
      const refreshed = await fetch("/api/admin/graphics");
      if (refreshed.ok) setRevisions((await refreshed.json()).revisions);
      setMessage(`Graphics settings published as version ${data.version}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish graphics settings");
    } finally {
      setPublishing(false);
    }
  };

  const restoreRevision = async (revision: Revision) => {
    try {
      const response = await fetch(`/api/admin/graphics/revisions/${revision.id}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to restore graphics version");
      const refreshed = await fetch("/api/admin/graphics");
      if (!refreshed.ok) throw new Error("Unable to reload restored graphics draft");
      const content = await refreshed.json();
      setDraft(content.draft);
      setMessage(`Version ${data.restoredVersion} restored to draft. Publish it to make it live.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to restore graphics version");
    }
  };

  const numericControl = (
    key: "cameraFov" | "cameraDistance" | "ambientIntensity" | "keyLightIntensity" | "fillLightIntensity" | "rimLightIntensity",
    label: string,
    min: number,
    max: number,
    step: number
  ) => (
    <label className="space-y-2 text-xs text-gray-300">
      <span className="flex justify-between"><span>{label}</span><span className="font-mono text-purple-300">{draft[key]}</span></span>
      <input type="range" min={min} max={max} step={step} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} className="w-full accent-purple-500" />
    </label>
  );

  if (loading) return <p className="text-sm text-gray-400">Loading graphics editor…</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-purple-400">Visual system</p>
          <h1 className="mt-2 text-2xl font-bold text-white">3D graphics studio</h1>
          <p className="mt-1 text-sm text-gray-400">Configure safe camera, lighting, background, animation, and device quality presets.</p>
        </div>
        <span className="rounded-full border border-[#252a37] px-3 py-1 text-xs text-gray-300">Published v{version}</span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5 rounded-2xl border border-[#1c202c] bg-[#0f121b] p-5">
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-white"><Sparkles className="h-4 w-4 text-purple-300" />Camera & scene</h2>
            {numericControl("cameraFov", "Camera field of view", 35, 70, 1)}
            {numericControl("cameraDistance", "Camera distance", 3, 7, 0.1)}
            <label className="flex items-center justify-between text-xs text-gray-300">Background color<input type="color" value={draft.backgroundColor} onChange={(event) => setDraft({ ...draft, backgroundColor: event.target.value })} className="h-9 w-12 cursor-pointer bg-transparent" /></label>
          </section>
          <section className="space-y-4 border-t border-[#252a37] pt-4">
            <h2 className="font-semibold text-white">Lighting</h2>
            {numericControl("ambientIntensity", "Ambient", 0.1, 2.5, 0.1)}
            {numericControl("keyLightIntensity", "Key light", 0.1, 5, 0.1)}
            {numericControl("fillLightIntensity", "Fill light", 0, 3, 0.1)}
            {numericControl("rimLightIntensity", "Rim light", 0, 3, 0.1)}
          </section>
          <section className="grid gap-3 border-t border-[#252a37] pt-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-gray-300">Animation preset<select className={fieldClass} value={draft.animationPreset} onChange={(event) => setDraft({ ...draft, animationPreset: event.target.value as GraphicsConfig["animationPreset"] })}>{["off", "slow-turn", "floating"].map((preset) => <option key={preset}>{preset}</option>)}</select></label>
            <label className="space-y-1 text-xs text-gray-300">Device quality<select className={fieldClass} value={draft.qualityPreset} onChange={(event) => setDraft({ ...draft, qualityPreset: event.target.value as GraphicsConfig["qualityPreset"] })}>{["auto", "high", "medium", "low"].map((preset) => <option key={preset}>{preset}</option>)}</select></label>
          </section>
          <div className="flex flex-wrap gap-3 border-t border-[#252a37] pt-4">
            <button type="button" onClick={saveDraft} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-lg border border-[#34394a] px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save draft</button>
            <button type="button" onClick={publish} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Publish</button>
          </div>
          {message && <p role="status" className={`text-sm ${message.includes("published") || message.includes("saved") ? "text-emerald-400" : "text-rose-400"}`}>{message}</p>}
          <section className="space-y-3 border-t border-[#252a37] pt-4">
            <div>
              <h2 className="font-semibold text-white">Published versions</h2>
              <p className="mt-1 text-xs text-gray-400">Restore a version into the draft, review it, then publish.</p>
            </div>
            <div className="space-y-2">
              {revisions.map((revision) => (
                <div key={revision.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#252a37] px-3 py-2">
                  <span className="text-xs text-gray-300">Version {revision.version} · {new Date(revision.createdAt).toLocaleString()}</span>
                  <button type="button" onClick={() => restoreRevision(revision)} className="text-xs text-purple-300 hover:text-white">Restore draft</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="font-semibold text-white">Live preview</h2>
            <p className="mt-1 text-xs text-gray-400">Preview uses the local draft. Customers only receive the published version.</p>
          </div>
          <EyewearViewer graphics={draft} frameColor="#383B42" lensColor="#0F172A" className="h-[520px] w-full" />
        </section>
      </div>
    </div>
  );
}
