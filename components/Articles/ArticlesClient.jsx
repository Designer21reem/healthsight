"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";

const SAMPLE_ARTICLES = [
  {
    id: 1,
    tag: "Diabetes",
    title: "Understanding Diabetes",
    author: "Dr. Amina Khalid",
    date: "09/12/2025",
    views: 1240,
    excerpt:
      "Learn how lifestyle, nutrition, and early detection can help manage diabetes effectively.",
    image: "/Diabetes.svg",
    highlight: "Quick prevention tips and dietary changes that make a difference.",
    content: "Full article content about diabetes... (replace with real content).",
    keyPoints: [
      "Symptoms and early detection",
      "Diet and lifestyle",
      "Medication and monitoring",
    ],
  },
  {
    id: 2,
    tag: "Exercise",
    title: "The Power of Daily Exercise",
    author: "Dr. Michael Chen",
    date: "10/18/2025",
    views: 2156,
    excerpt:
      "Discover how just 30 minutes of physical activity can boost your immunity, reduce stress, and support a healthy heart.",
    image: "/power.svg",
    highlight:
      "Explore strategies to maintain mental wellness during disease outbreaks and health emergencies.",
    content: "Full article content about exercise... (replace with real content).",
    keyPoints: ["30 minutes daily", "Cardio and strength mix", "Consistency matters"],
  },
  {
    id: 3,
    tag: "Heart Health",
    title: "Heart Disease Prevention",
    author: "Dr. Lina Farah",
    date: "08/05/2025",
    views: 980,
    excerpt:
      "Find out the major risk factors and simple daily habits that can reduce your chances of heart-related diseases.",
    image: "/Heart.svg",
    highlight: "Key lifestyle changes to improve cardiovascular health.",
    content: "Full article content about heart disease... (replace with real content).",
    keyPoints: ["Know your numbers", "Healthy diet", "Regular activity"],
  },
];

function safeImg(src) {
  const s = (src || "").trim();
  return s.length ? s : null;
}

function ArticleModal({ article, onClose }) {
  if (!article) return null;
  if (typeof document === "undefined") return null;

  const modal = (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>

        <div className="mb-2 inline-block rounded-full bg-gray-900 px-3 py-1 text-sm text-white">
          {article.tag}
        </div>
        <h2 className="mt-4 text-2xl font-extrabold">{article.title}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <div>👤 {article.author}</div>
          <div>📅 {article.date}</div>
          <div>👁️ {article.views} views</div>
        </div>

        {article.highlight ? (
          <blockquote className="mt-6 rounded-md border-l-4 border-blue-300 bg-blue-50 p-4 italic text-gray-700">
            {article.highlight}
          </blockquote>
        ) : null}

        <div className="mt-6 text-gray-700 leading-relaxed">{article.content}</div>

        <h3 className="mt-6 text-lg font-bold">Key Points</h3>
        <ul className="mt-3 list-disc pl-6 text-gray-700">
          {(article.keyPoints || []).map((kp, i) => (
            <li key={i} className="py-1">
              {kp}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-lg font-bold">Recommendations</h3>
        <p className="mt-2 text-gray-700">
          Consult with healthcare professionals for personalized advice. This article is for
          informational purposes only and should not replace professional medical consultation.
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function ArticlesClient() {
  const [articles, setArticles] = useState(SAMPLE_ARTICLES);
  const [index, setIndex] = useState(1);
  const [modalArticle, setModalArticle] = useState(null);

  async function fetchPublishedArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Fetch published articles error:", error);
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
      image: safeImg(a.image),
      highlight: a.highlight || "",
      content: a.content || "",
      keyPoints: a.key_points || [],
      slug: a.slug,
    }));

    if (mapped.length > 0) {
      setArticles(mapped);
      setIndex(0);
    }
  }

  useEffect(() => {
    fetchPublishedArticles();

    const channel = supabase
      .channel("articles_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "articles" },
        () => {
          fetchPublishedArticles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const prev = () => setIndex((i) => (i - 1 + articles.length) % articles.length);
  const next = () => setIndex((i) => (i + 1) % articles.length);

  if (!articles || articles.length === 0) return null;

  const safeIndex = ((index % articles.length) + articles.length) % articles.length;
  const center = articles[safeIndex];
  const left =
    articles.length >= 2
      ? articles[(safeIndex - 1 + articles.length) % articles.length]
      : center;
  const right =
    articles.length >= 3
      ? articles[(safeIndex + 1) % articles.length]
      : left;

  async function openAndCountViews(article) {
    setModalArticle(article);

    setArticles((prevArts) =>
      prevArts.map((a) =>
        a.id === article.id ? { ...a, views: (a.views || 0) + 1 } : a
      )
    );

    const { error } = await supabase.rpc("increment_article_views", {
      article_id: article.id,
    });
    if (error) {
      console.error("Increment views error:", error);
      await fetchPublishedArticles();
      return;
    }

    await fetchPublishedArticles();
  }

  return (
    <div className="relative">
      {/* =========================
          Desktop / Tablet (3 cards)
          ========================= */}
      <div className="hidden md:flex items-start justify-center gap-6">
        <article className="w-48 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          {safeImg(left.image) ? (
            <img
              src={left.image}
              alt={left.title}
              className="mb-3 h-20 w-full rounded-md object-cover"
            />
          ) : (
            <div className="mb-3 h-20 w-full rounded-md bg-gray-100" />
          )}
          <h3 className="text-sm font-semibold">{left.title}</h3>
          <p className="mt-2 text-xs text-gray-500">{left.excerpt}</p>
          <button
            onClick={() => openAndCountViews(left)}
            className="mt-3 inline-block text-xs text-indigo-600"
          >
            Read more →
          </button>
        </article>

        <article className="w-[540px] rounded-lg border border-gray-100 bg-white p-6 shadow-md relative">
          {safeImg(center.image) ? (
            <img
              src={center.image}
              alt={center.title}
              className="mb-4 h-44 w-full rounded-md object-cover"
            />
          ) : (
            <div className="mb-4 h-44 w-full rounded-md bg-gray-100" />
          )}

          <h2 className="text-xl font-bold">{center.title}</h2>
          <p className="mt-3 text-sm text-gray-600">{center.excerpt}</p>
          <button
            onClick={() => openAndCountViews(center)}
            className="mt-4 inline-block text-sm text-indigo-600"
          >
            Read more →
          </button>

          {articles.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous"
                className="absolute -left-7 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-105 transition-transform"
              >
                ◀
              </button>
              <button
                onClick={next}
                aria-label="Next"
                className="absolute -right-7 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-105 transition-transform"
              >
                ▶
              </button>
            </>
          )}
        </article>

        <article className="w-48 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          {safeImg(right.image) ? (
            <img
              src={right.image}
              alt={right.title}
              className="mb-3 h-20 w-full rounded-md object-cover"
            />
          ) : (
            <div className="mb-3 h-20 w-full rounded-md bg-gray-100" />
          )}
          <h3 className="text-sm font-semibold">{right.title}</h3>
          <p className="mt-2 text-xs text-gray-500">{right.excerpt}</p>
          <button
            onClick={() => openAndCountViews(right)}
            className="mt-3 inline-block text-xs text-indigo-600"
          >
            Read more →
          </button>
        </article>
      </div>

      {/* =========================
          Mobile (ONE article only + arrows)
          ========================= */}
      <div className="md:hidden">
        <div className="relative">
          {articles.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 p-2 shadow border border-gray-100 active:scale-95 transition-transform"
              >
                ◀
              </button>
              <button
                onClick={next}
                aria-label="Next"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 p-2 shadow border border-gray-100 active:scale-95 transition-transform"
              >
                ▶
              </button>
            </>
          )}

          <article className="w-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            {safeImg(center.image) ? (
              <img
                src={center.image}
                alt={center.title}
                className="mb-4 h-44 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mb-4 h-44 w-full rounded-lg bg-gray-100" />
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs text-white">
                {center.tag}
              </div>
              <div className="text-xs text-gray-500">{center.date}</div>
            </div>

            <h2 className="mt-3 text-lg font-bold leading-snug">{center.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{center.excerpt}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>👤 {center.author}</span>
              <span>👁️ {center.views}</span>
            </div>

            <button
              onClick={() => openAndCountViews(center)}
              className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600"
            >
              Read more →
            </button>
          </article>
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-3">
        {articles.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full ${
              i === safeIndex ? "bg-indigo-500" : "bg-indigo-100"
            }`}
            aria-label={`Go to article ${i + 1}`}
          />
        ))}
      </div>

      <ArticleModal article={modalArticle} onClose={() => setModalArticle(null)} />
    </div>
  );
}
