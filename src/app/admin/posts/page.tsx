"use client";

import { FormEvent, useEffect, useState } from "react";
import { Archive, Loader2, Newspaper, Pencil, Plus, X } from "lucide-react";

type Post = {
  id: string;
  title: string;
  type: string;
  status: string;
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  coverImage: string | null;
  subtitle: string | null;
  description: string;
  animation: string;
  isFeatured: boolean;
  priority: number;
};

const emptyPost = {
  title: "",
  subtitle: "",
  description: "",
  coverImage: "",
  type: "ANNOUNCEMENT",
  status: "DRAFT",
  animation: "none",
  isFeatured: false,
  priority: 0,
  publishedAt: "",
  startsAt: "",
  endsAt: "",
};

const inputClass = "w-full rounded-lg border border-[#252a37] bg-[#10131c] px-3 py-2 text-sm text-white outline-none focus:border-purple-500";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState(emptyPost);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load posts");
      setPosts(data.posts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const dateValue = form.publishedAt ? new Date(form.publishedAt).toISOString() : null;
      const response = await fetch(editingId ? `/api/admin/posts/${editingId}` : "/api/admin/posts", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subtitle: form.subtitle || null,
          coverImage: form.coverImage || null,
          publishedAt: dateValue,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create post");
      setForm(emptyPost);
      setIsOpen(false);
      setEditingId(null);
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create post");
    } finally {
      setSaving(false);
    }
  };

  const edit = (post: Post) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      subtitle: post.subtitle || "",
      description: post.description,
      coverImage: post.coverImage || "",
      type: post.type,
      status: post.status === "ARCHIVED" ? "DRAFT" : post.status,
      animation: post.animation,
      isFeatured: post.isFeatured,
      priority: post.priority,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "",
      startsAt: post.startsAt ? new Date(post.startsAt).toISOString().slice(0, 16) : "",
      endsAt: post.endsAt ? new Date(post.endsAt).toISOString().slice(0, 16) : "",
    });
    setIsOpen(true);
  };

  const archive = async (post: Post) => {
    if (!confirm(`Archive "${post.title}"?`)) return;
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to archive post");
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to archive post");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-purple-400">Storefront publishing</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Posts & announcements</h1>
          <p className="mt-1 text-sm text-gray-400">Publish product launches, promotions, collections, and editorial content.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
          <Plus className="h-4 w-4" /> Create post
        </button>
      </header>

      {message && <p role="status" className="text-sm text-rose-400">{message}</p>}
      <div className="overflow-hidden rounded-2xl border border-[#1c202c] bg-[#0f121b]">
        {loading ? <p className="p-8 text-center text-sm text-gray-400">Loading posts…</p> : posts.length === 0 ? (
          <div className="p-10 text-center text-gray-400"><Newspaper className="mx-auto mb-3 h-8 w-8 opacity-60" /><p>No posts yet. Create one to feature it on the storefront.</p></div>
        ) : (
          <div className="divide-y divide-[#1c202c]">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-wrap items-center gap-4 p-4">
                {post.coverImage ? <img src={post.coverImage} alt="" className="h-14 w-20 rounded-lg object-cover" /> : <div className="h-14 w-20 rounded-lg bg-[#171b27]" />}
                <div className="min-w-48 flex-1">
                  <p className="font-semibold text-white">{post.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{post.type} · {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : "Not published yet"}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${post.status === "PUBLISHED" ? "bg-emerald-950 text-emerald-300" : "bg-gray-800 text-gray-300"}`}>{post.status}</span>
                {post.isFeatured && <span className="text-xs text-amber-300">Featured · {post.priority}</span>}
                {post.status !== "ARCHIVED" && <button onClick={() => edit(post)} className="rounded-lg p-2 text-gray-400 hover:bg-purple-950/30 hover:text-purple-300" aria-label={`Edit ${post.title}`}><Pencil className="h-4 w-4" /></button>}
                {post.status !== "ARCHIVED" && <button onClick={() => archive(post)} className="rounded-lg p-2 text-gray-400 hover:bg-rose-950/30 hover:text-rose-300" aria-label={`Archive ${post.title}`}><Archive className="h-4 w-4" /></button>}
              </article>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-[#252a37] bg-[#0c0f16] p-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-white">{editingId ? "Edit post" : "Create post"}</h2><p className="text-xs text-gray-400">Posts are shown in the storefront&apos;s Latest section when published.</p></div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <label className="block space-y-1 text-xs text-gray-400">Title<input required maxLength={160} className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label className="block space-y-1 text-xs text-gray-400">Subtitle<input className={inputClass} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></label>
            <label className="block space-y-1 text-xs text-gray-400">Description<textarea required rows={5} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className="block space-y-1 text-xs text-gray-400">Cover image URL<input type="url" className={inputClass} value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-gray-400">Type<select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["PRODUCT", "ANNOUNCEMENT", "PROMOTION", "ARTICLE", "COLLECTION"].map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="space-y-1 text-xs text-gray-400">Status<select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["DRAFT", "SCHEDULED", "PUBLISHED"].map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="space-y-1 text-xs text-gray-400">Publish date/time (required if scheduled)<input type="datetime-local" className={inputClass} value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} /></label>
              <label className="space-y-1 text-xs text-gray-400">Display starts at (optional)<input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
              <label className="space-y-1 text-xs text-gray-400">Display ends at (optional)<input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
              <label className="space-y-1 text-xs text-gray-400">Transition<select className={inputClass} value={form.animation} onChange={(e) => setForm({ ...form, animation: e.target.value })}>{["none", "fade", "slide", "scale", "rotate", "carousel"].map((animation) => <option key={animation}>{animation}</option>)}</select></label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured post</label>
              <label className="flex items-center gap-2 text-xs text-gray-400">Priority<input type="number" min={0} max={100} className={`${inputClass} w-24`} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setIsOpen(false); setEditingId(null); setForm(emptyPost); }} className="rounded-lg border border-[#252a37] px-4 py-2 text-sm text-gray-300">Cancel</button>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? "Update post" : "Save post"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
