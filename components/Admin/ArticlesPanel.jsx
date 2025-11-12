"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, User, Calendar, Eye } from 'lucide-react';

function Modal({ children, onClose, title }) {
  if (typeof document === 'undefined') return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-600">✕</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function makeId(title) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
}

export default function ArticlesPanel() {
  const [articles, setArticles] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('healthsight_articles') : null;
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // fallback sample minimal items
    return [
      { id: 'sample-1', tag: 'Infectious', title: 'Understanding Cholera: Prevention and Treatment', author: 'Dr. Sarah Ahmed', date: '10/20/2025', views: 1234, excerpt: 'Cholera is an acute diarrheal illness caused by infection of the intestine. Learn about prevention methods and ...', content: 'Full content', keyPoints: [] },
      { id: 'sample-2', tag: 'Public Health', title: 'Vaccination Basics', author: 'Dr. Ali', date: '09/10/2025', views: 980, excerpt: 'Why immunization is important.', content: 'Full content', keyPoints: [] },
    ];
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('healthsight_articles', JSON.stringify(articles));
    } catch (e) {}
  }, [articles]);

  const totals = useMemo(() => {
    const total = articles.length;
    const views = articles.reduce((s, a) => s + (a.views || 0), 0);
    const avg = Math.round(views / Math.max(1, total));
    return { total, views, avg };
  }, [articles]);

  function openAdd() {
    setEditing({ title: '', tag: '', author: '', date: new Date().toLocaleDateString('en-GB'), excerpt: '', content: '', views: 0, keyPoints: [] });
    setShowModal(true);
  }

  function openEdit(a) {
    setEditing({ ...a, keyPoints: (a.keyPoints || []).join(', ') });
    setShowModal(true);
  }

  function saveArticle(form) {
    const kp = (form.keyPoints || '').split(',').map(s => s.trim()).filter(Boolean);
    const getImageForTag = (tag) => {
      if (!tag) return '';
      const t = tag.toLowerCase();
      if (t.includes('diabetes')) return '/Diabetes.svg';
      if (t.includes('heart') || t.includes('cardio')) return '/Heart.svg';
      if (t.includes('infect') || t.includes('cholera') || t.includes('disease')) return '/Virus.svg';
      if (t.includes('exercise')) return '/power.svg';
      return '';
    };

    const formWithImage = { ...form, keyPoints: kp, image: form.image || getImageForTag(form.tag) };

    if (form.id) {
      // update
      const next = articles.map(p => p.id === form.id ? { ...p, ...formWithImage } : p);
      setArticles(next);
      // notify other components in the same tab
      try { window.dispatchEvent(new CustomEvent('healthsight_articles_updated', { detail: next })); } catch (e) {}
    } else {
      const id = makeId(form.title || 'article');
      const next = [{ ...formWithImage, id }, ...articles];
      setArticles(next);
      try { window.dispatchEvent(new CustomEvent('healthsight_articles_updated', { detail: next })); } catch (e) {}
    }
    setShowModal(false);
    setEditing(null);
  }

  function deleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const next = articles.filter(a => a.id !== id);
    setArticles(next);
    try { window.dispatchEvent(new CustomEvent('healthsight_articles_updated', { detail: next })); } catch (e) {}
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
            <button onClick={openAdd} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Add Article</button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-6">Total Articles<br/><span className="text-2xl font-bold text-indigo-600">{totals.total}</span></div>
          <div className="rounded-lg border p-6">Total Views<br/><span className="text-2xl font-bold text-green-600">{totals.views.toLocaleString()}</span></div>
          <div className="rounded-lg border p-6">This Month<br/><span className="text-2xl font-bold text-red-500">0</span></div>
          <div className="rounded-lg border p-6">Avg. Views<br/><span className="text-2xl font-bold text-purple-600">{totals.avg}</span></div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {articles.map((a) => (
            <article key={a.id} className="relative rounded-lg border p-6 bg-white shadow-sm">
              {/* article thumbnail (if provided) */}
              {a.image && (
                <div className="mb-4">
                  <img src={a.image} alt={a.title} className="w-full h-36 object-cover rounded-md" />
                </div>
              )}
              {/* top row: tag + action icons */}
              <div className="flex items-start justify-between">
                <div className="mb-2 inline-block rounded-full bg-gray-900 px-3 py-1 text-sm text-white">{a.tag || 'General'}</div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(a)} aria-label="Edit article" title="Edit" className="inline-flex h-8 w-8 items-center justify-center rounded border bg-white text-gray-600 hover:bg-gray-50">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteArticle(a.id)} aria-label="Delete article" title="Delete" className="inline-flex h-8 w-8 items-center justify-center rounded border bg-white text-red-600 hover:bg-red-50">
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
                  <span>{(a.views||0).toLocaleString()} views</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showModal && editing && (
        <Modal title={editing.id ? 'Edit Article' : 'Add Article'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <ArticleForm initial={editing} onCancel={() => { setShowModal(false); setEditing(null); }} onSave={saveArticle} />
        </Modal>
      )}
    </section>
  );
}

function ArticleForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({ ...initial }));

  useEffect(() => setForm({ ...initial }), [initial]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-600">Title</label>
        <input required value={form.title||''} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600">Tag</label>
          <input value={form.tag||''} onChange={(e)=>setForm(f=>({...f,tag:e.target.value}))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Author</label>
          <input value={form.author||''} onChange={(e)=>setForm(f=>({...f,author:e.target.value}))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600">Image URL (optional)</label>
        <input value={form.image||''} onChange={(e)=>setForm(f=>({...f,image:e.target.value}))} placeholder="/Diabetes.svg or https://..." className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Excerpt</label>
        <textarea value={form.excerpt||''} onChange={(e)=>setForm(f=>({...f,excerpt:e.target.value}))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" rows={3} />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Content</label>
        <textarea value={form.content||''} onChange={(e)=>setForm(f=>({...f,content:e.target.value}))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" rows={6} />
      </div>

      <div>
        <label className="block text-xs text-gray-600">Key points (comma separated)</label>
        <input value={form.keyPoints||''} onChange={(e)=>setForm(f=>({...f,keyPoints:e.target.value}))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">Save Article</button>
      </div>
    </form>
  );
}
