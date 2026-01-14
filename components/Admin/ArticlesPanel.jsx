"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Trash2, User, Calendar, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function Modal({ children, onClose, title }) {
  if (typeof document === "undefined") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b p-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function slugifyTitle(title) {
  const base = (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `article-${Date.now()}`;
}

export default function ArticlesPanel() {
  const [articles, setArticles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchArticles() {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch articles error:", error);
      alert(`Fetch error: ${error.message}`);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((a) => ({
      id: a.id,
      tag: a.tag || "General",
      title: a.title || "",
      author: a.author_name || "Admin",
      date: a.published_at
        ? new Date(a.published_at).toLocaleDateString("en-GB")
        : new Date(a.created_at).toLocaleDateString("en-GB"),
      views: a.views || 0,
      excerpt: a.excerpt || "",
      content: a.content || "",
      keyPoints: a.key_points || [],
      image: a.image || "",
      highlight: a.highlight || "",
      isPublished: !!a.is_published,
      slug: a.slug || "",
      author_id: a.author_id,
      created_at: a.created_at,
      updated_at: a.updated_at,
      published_at: a.published_at,
    }));

    setArticles(mapped);
    setLoading(false);
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  const totals = useMemo(() => {
    const total = articles.length;
    const views = articles.reduce((s, a) => s + (a.views || 0), 0);
    const avg = Math.round(views / Math.max(1, total));
    return { total, views, avg };
  }, [articles]);

  function openAdd() {
    setEditing({
      title: "",
      tag: "",
      author: "",
      date: new Date().toLocaleDateString("en-GB"),
      excerpt: "",
      content: "",
      views: 0,
      keyPoints: "",
      image: "",
      highlight: "",
      isPublished: true,
      slug: "",
    });
    setShowModal(true);
  }

  function openEdit(a) {
    setEditing({
      ...a,
      keyPoints: (a.keyPoints || []).join(", "),
      author: a.author || "",
      isPublished: a.isPublished ?? true,
      slug: a.slug || "",
    });
    setShowModal(true);
  }

  function getImageForTag(tag) {
    if (!tag) return "";
    const t = tag.toLowerCase();
    if (t.includes("diabetes")) return "/Diabetes.svg";
    if (t.includes("heart") || t.includes("cardio")) return "/Heart.svg";
    if (t.includes("infect") || t.includes("cholera") || t.includes("disease")) return "/Virus.svg";
    if (t.includes("exercise")) return "/power.svg";
    return "";
  }

  // ✅ NEW: Admin check via RPC (is_admin)
  async function ensureAdmin() {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return { ok: false, message: "You must be logged in." };
    }

    const { data: isAdmin, error } = await supabase.rpc("is_admin");

    if (error) {
      console.error("is_admin RPC error:", error);
      return { ok: false, message: `Admin check failed: ${error.message}` };
    }

    if (!isAdmin) {
      return { ok: false, message: "Access denied: your role is not admin." };
    }

    return { ok: true, user: authData.user };
  }

  // ✅ save with timeout + no infinite saving
  async function saveArticle(form) {
    const withTimeout = (promise, ms = 12000) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), ms)),
      ]);

    setSaving(true);
    console.log("🟡 saveArticle start", { form });

    try {
      console.log("🟡 ensureAdmin (RPC)...");
      const adminCheck = await withTimeout(ensureAdmin(), 12000);
      console.log("🟢 ensureAdmin result:", adminCheck);

      if (!adminCheck.ok) {
        alert(adminCheck.message);
        return;
      }

      const kp = (form.keyPoints || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const image = form.image || getImageForTag(form.tag);
      const slug = form.slug && form.slug.trim() ? form.slug.trim() : slugifyTitle(form.title);

      const payload = {
        tag: form.tag || "General",
        title: form.title || "",
        author_name: form.author || "Admin",
        excerpt: form.excerpt || "",
        content: form.content || "",
        image: image || null,
        highlight: form.highlight || null,
        key_points: kp,
        is_published: !!form.isPublished,
        slug,
      };

      console.log("🟡 payload ready", payload);

      if (form.id) {
        console.log("🟡 updating article id:", form.id);

        const { error } = await withTimeout(
          supabase.from("articles").update(payload).eq("id", form.id),
          12000
        );

        if (error) {
          console.error("🔴 Update error:", error);
          alert(`Update failed: ${error.message}`);
          return;
        }

        console.log("🟢 update success");
      } else {
        console.log("🟡 inserting new article...");

        const insertPayload = {
          ...payload,
          author_id: adminCheck.user.id,
        };

        const { error } = await withTimeout(
          supabase.from("articles").insert(insertPayload),
          12000
        );

        if (error) {
          console.error("🔴 Insert error:", error);
          alert(`Insert failed: ${error.message}`);
          return;
        }

        console.log("🟢 insert success");
      }

      console.log("🟡 refreshing list...");
      await withTimeout(fetchArticles(), 12000);

      setShowModal(false);
      setEditing(null);

      console.log("🟢 done");
    } catch (err) {
      console.error("🔴 saveArticle crashed/hanged:", err);

      if (String(err?.message || "").toLowerCase().includes("timeout")) {
        alert("Saving took too long (timeout). Check RLS policies or your connection, then try again.");
      } else {
        alert(err?.message || "Something went wrong while saving.");
      }
    } finally {
      setSaving(false);
      console.log("🟣 saveArticle end -> saving=false");
    }
  }

  async function deleteArticle(id) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.ok) {
      alert(adminCheck.message);
      return;
    }

    if (!confirm("Are you sure you want to delete this article?")) return;

    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) {
      console.error("Delete error:", error);
      alert(`Delete failed: ${error.message}`);
      return;
    }

    await fetchArticles();
  }

  return (
    <section>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Medical Articles</h3>
            <p className="text-sm text-gray-600 mt-2">Create and manage educational content</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openAdd} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">
              Add Article
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-6">
            Total Articles<br />
            <span className="text-2xl font-bold text-indigo-600">{totals.total}</span>
          </div>
          <div className="rounded-lg border p-6">
            Total Views<br />
            <span className="text-2xl font-bold text-green-600">{totals.views.toLocaleString()}</span>
          </div>
          <div className="rounded-lg border p-6">
            This Month<br />
            <span className="text-2xl font-bold text-red-500">0</span>
          </div>
          <div className="rounded-lg border p-6">
            Avg. Views<br />
            <span className="text-2xl font-bold text-purple-600">{totals.avg}</span>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-gray-600">Loading...</div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {articles.map((a) => (
              <article key={a.id} className="relative rounded-lg border p-6 bg-white shadow-sm">
                {a.image && (
                  <div className="mb-4">
                    <img src={a.image} alt={a.title} className="w-full h-36 object-cover rounded-md" />
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="mb-2 inline-block rounded-full bg-gray-900 px-3 py-1 text-sm text-white">
                    {a.tag || "General"}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(a)}
                      aria-label="Edit article"
                      title="Edit"
                      className="inline-flex h-8 w-8 items-center justify-center rounded border bg-white text-gray-600 hover:bg-gray-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteArticle(a.id)}
                      aria-label="Delete article"
                      title="Delete"
                      className="inline-flex h-8 w-8 items-center justify-center rounded border bg-white text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h4 className="mt-2 text-lg font-semibold text-gray-900">{a.title}</h4>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{a.excerpt}</p>

                <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{a.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{a.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span>{(a.views || 0).toLocaleString()} views</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showModal && editing && (
        <Modal
          title={editing.id ? "Edit Article" : "Add Article"}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        >
          <ArticleForm
            initial={editing}
            onCancel={() => {
              setShowModal(false);
              setEditing(null);
            }}
            onSave={saveArticle}
            saving={saving}
          />
        </Modal>
      )}
    </section>
  );
}

function ArticleForm({ initial = {}, onCancel, onSave, saving }) {
  const [form, setForm] = useState(() => ({ ...initial }));

  useEffect(() => setForm({ ...initial }), [initial]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs text-gray-600">Title</label>
        <input
          required
          value={form.title || ""}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600">Tag</label>
          <input
            value={form.tag || ""}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Author</label>
          <input
            value={form.author || ""}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600">Slug (optional)</label>
        <input
          value={form.slug || ""}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="understanding-diabetes"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Image URL (optional)</label>
        <input
          value={form.image || ""}
          onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          placeholder="/Diabetes.svg or https://..."
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Excerpt</label>
        <textarea
          value={form.excerpt || ""}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Content</label>
        <textarea
          value={form.content || ""}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          rows={6}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Highlight (optional)</label>
        <textarea
          value={form.highlight || ""}
          onChange={(e) => setForm((f) => ({ ...f, highlight: e.target.value }))}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Key points (comma separated)</label>
        <input
          value={form.keyPoints || ""}
          onChange={(e) => setForm((f) => ({ ...f, keyPoints: e.target.value }))}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="pub"
          type="checkbox"
          checked={!!form.isPublished}
          onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
        />
        <label htmlFor="pub" className="text-sm text-gray-700">
          Published
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded border px-4 py-2 text-sm" disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={saving}>
          {saving ? "Saving..." : "Save Article"}
        </button>
      </div>
    </form>
  );
}
