"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";

type Section = {
  key: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  background: string | null;
  animation: "none" | "fade" | "slide" | "scale" | "rotate";
  isEnabled: boolean;
  displayOrder: number;
};

type Settings = {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
};

const inputClass = "w-full rounded-lg border border-[#252a37] bg-[#10131c] px-3 py-2 text-sm text-white outline-none focus:border-purple-500";

export default function HomepageContentPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/content/homepage")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load homepage content");
        setSettings(data.settings);
        setSections(data.sections);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const updateSection = (index: number, changes: Partial<Section>) => {
    setSections((current) => current.map((section, itemIndex) =>
      itemIndex === index ? { ...section, ...changes } : section
    ));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/content/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, sections }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save homepage content");
      window.dispatchEvent(new Event("eyecap:branding-updated"));
      setMessage("Changes saved and are now live on the storefront.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save homepage content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-400">Loading homepage controls…</div>;
  if (!settings) return <div className="text-sm text-rose-400">{message || "Homepage settings unavailable."}</div>;

  return (
    <form onSubmit={save} className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-purple-400">Content management</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Homepage & brand settings</h1>
          <p className="mt-1 text-sm text-gray-400">Edit storefront messaging, appearance, and section visibility.</p>
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save and publish
        </button>
      </header>

      <section className="space-y-4 rounded-2xl border border-[#1c202c] bg-[#0f121b] p-5">
        <h2 className="font-semibold text-white">Site identity and appearance</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-gray-400">Website name<input className={inputClass} value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} /></label>
          <label className="space-y-1 text-xs text-gray-400">Default page title<input className={inputClass} value={settings.defaultTitle} onChange={(e) => setSettings({ ...settings, defaultTitle: e.target.value })} /></label>
          <label className="space-y-1 text-xs text-gray-400">Title template<input className={inputClass} value={settings.titleTemplate} onChange={(e) => setSettings({ ...settings, titleTemplate: e.target.value })} /></label>
          <label className="space-y-1 text-xs text-gray-400">Logo image URL<input className={inputClass} value={settings.logoUrl || ""} onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value || null })} /></label>
          <label className="space-y-1 text-xs text-gray-400">Favicon URL<input className={inputClass} value={settings.faviconUrl || ""} onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value || null })} /></label>
          <label className="space-y-1 text-xs text-gray-400">SEO description<textarea className={inputClass} rows={2} value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            ["primaryColor", "Primary color"],
            ["accentColor", "Accent color"],
            ["backgroundColor", "Background color"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-[#252a37] bg-[#10131c] p-3 text-xs text-gray-300">
              {label}
              <input type="color" value={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} className="h-8 w-10 cursor-pointer bg-transparent" />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-white">Homepage sections</h2>
          <p className="mt-1 text-xs text-gray-400">Edit section copy and order. Disabled sections are hidden from the customer homepage.</p>
        </div>
        {sections.map((section, index) => (
          <article key={section.key} className="space-y-4 rounded-2xl border border-[#1c202c] bg-[#0f121b] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold capitalize text-white">{section.key.replaceAll("-", " ")}</p>
                <p className="text-[11px] text-gray-500">Section key: {section.key}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input type="checkbox" checked={section.isEnabled} onChange={(e) => updateSection(index, { isEnabled: e.target.checked })} />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  Order
                  <input type="number" min={0} max={1000} className={`${inputClass} w-20`} value={section.displayOrder} onChange={(e) => updateSection(index, { displayOrder: Number(e.target.value) })} />
                </label>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-gray-400">Title<input className={inputClass} value={section.title} onChange={(e) => updateSection(index, { title: e.target.value })} /></label>
              <label className="space-y-1 text-xs text-gray-400">Subtitle<input className={inputClass} value={section.subtitle || ""} onChange={(e) => updateSection(index, { subtitle: e.target.value || null })} /></label>
              <label className="space-y-1 text-xs text-gray-400 sm:col-span-2">Description<textarea rows={3} className={inputClass} value={section.body || ""} onChange={(e) => updateSection(index, { body: e.target.value || null })} /></label>
              {section.key === "hero" && <label className="space-y-1 text-xs text-gray-400">Hero image URL<input className={inputClass} value={section.imageUrl || ""} onChange={(e) => updateSection(index, { imageUrl: e.target.value || null })} /></label>}
              <label className="space-y-1 text-xs text-gray-400">Background<input className={inputClass} value={section.background || ""} onChange={(e) => updateSection(index, { background: e.target.value || null })} /></label>
              <label className="space-y-1 text-xs text-gray-400">Button label<input className={inputClass} value={section.ctaText || ""} onChange={(e) => updateSection(index, { ctaText: e.target.value || null })} /></label>
              <label className="space-y-1 text-xs text-gray-400">Button destination<input className={inputClass} value={section.ctaUrl || ""} onChange={(e) => updateSection(index, { ctaUrl: e.target.value || null })} /></label>
              <label className="space-y-1 text-xs text-gray-400">Transition<select className={inputClass} value={section.animation} onChange={(e) => updateSection(index, { animation: e.target.value as Section["animation"] })}>{["none", "fade", "slide", "scale", "rotate"].map((animation) => <option key={animation}>{animation}</option>)}</select></label>
            </div>
          </article>
        ))}
      </section>

      {message && <p role="status" className={`text-sm ${message.includes("saved") ? "text-emerald-400" : "text-rose-400"}`}>{message.includes("saved") && <Check className="mr-1 inline h-4 w-4" />}{message}</p>}
    </form>
  );
}
