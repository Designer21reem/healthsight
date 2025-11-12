"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SAMPLE_ARTICLES = [
  {
    id: "understanding-diabetes",
    tag: "Diabetes",
    title: "Understanding Diabetes",
    author: "Dr. Amina Khalid",
    date: "09/12/2025",
    views: 1240,
    excerpt: "Learn how lifestyle, nutrition, and early detection can help manage diabetes effectively.",
    image: "/Diabetes.svg",
    highlight: "Quick prevention tips and dietary changes that make a difference.",
    content: "Full article content about diabetes... (replace with real content).",
    keyPoints: ["Symptoms and early detection", "Diet and lifestyle", "Medication and monitoring"],
  },
  {
    id: "daily-exercise",
    tag: "Exercise",
    title: "The Power of Daily Exercise",
    author: "Dr. Michael Chen",
    date: "10/18/2025",
    views: 2156,
    excerpt: "Discover how just 30 minutes of physical activity can boost your immunity, reduce stress, and support a healthy heart.",
    image: "/power.svg",
    highlight: "Explore strategies to maintain mental wellness during disease outbreaks and health emergencies.",
    content: "Full article content about exercise... (replace with real content).",
    keyPoints: ["30 minutes daily", "Cardio and strength mix", "Consistency matters"],
  },
  {
    id: "heart-disease-prevention",
    tag: "Heart Health",
    title: "Heart Disease Prevention",
    author: "Dr. Lina Farah",
    date: "08/05/2025",
    views: 980,
    excerpt: "Find out the major risk factors and simple daily habits that can reduce your chances of heart-related diseases.",
    image: "/Heart.svg",
    highlight: "Key lifestyle changes to improve cardiovascular health.",
    content: "Full article content about heart disease... (replace with real content).",
    keyPoints: ["Know your numbers", "Healthy diet", "Regular activity"],
  },
];

function ArticleModal({ article, onClose }) {
  if (!article) return null;
  if (typeof document === "undefined") return null;

  const modal = (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-auto">
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

        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <div>👤 {article.author}</div>
          <div>📅 {article.date}</div>
          <div>👁️ {article.views} views</div>
        </div>

        <blockquote className="mt-6 rounded-md border-l-4 border-blue-300 bg-blue-50 p-4 italic text-gray-700">
          {article.highlight}
        </blockquote>

        <div className="mt-6 text-gray-700 leading-relaxed">{article.content}</div>

        <h3 className="mt-6 text-lg font-bold">Key Points</h3>
        <ul className="mt-3 list-disc pl-6 text-gray-700">
          {article.keyPoints.map((kp, i) => (
            <li key={i} className="py-1">
              {kp}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-lg font-bold">Recommendations</h3>
        <p className="mt-2 text-gray-700">
          Consult with healthcare professionals for personalized advice. This article is for informational purposes only
          and should not replace professional medical consultation.
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
  const [hydrated, setHydrated] = useState(false);

  // ✅ فقط بعد تحميل المتصفح
  useEffect(() => {
    setHydrated(true);
    try {
      const raw = window.localStorage.getItem("healthsight_articles");
      if (raw) setArticles(JSON.parse(raw));
    } catch (e) {}
  }, []);

  // ✅ حفظ التغييرات في localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("healthsight_articles", JSON.stringify(articles));
    } catch (e) {}
  }, [articles, hydrated]);

  const prev = () => setIndex((i) => (i - 1 + articles.length) % articles.length);
  const next = () => setIndex((i) => (i + 1) % articles.length);

  const left = articles[(index - 1 + articles.length) % articles.length];
  const center = articles[index];
  const right = articles[(index + 1) % articles.length];

  return (
    <div className="relative">
      <div className="flex items-start justify-center gap-6">
        <article className="w-48 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <img src={left.image} alt={left.title} className="mb-3 h-20 w-full rounded-md object-cover" />
          <h3 className="text-sm font-semibold">{left.title}</h3>
          <p className="mt-2 text-xs text-gray-500">{left.excerpt}</p>
          <button onClick={() => setModalArticle(left)} className="mt-3 inline-block text-xs text-indigo-600">
            Read more →
          </button>
        </article>

        <article className="w-[540px] rounded-lg border border-gray-100 bg-white p-6 shadow-md relative">
          <img src={center.image} alt={center.title} className="mb-4 h-44 w-full rounded-md object-cover" />
          <h2 className="text-xl font-bold">{center.title}</h2>
          <p className="mt-3 text-sm text-gray-600">{center.excerpt}</p>
          <button onClick={() => setModalArticle(center)} className="mt-4 inline-block text-sm text-indigo-600">
            Read more →
          </button>

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
        </article>

        <article className="w-48 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <img src={right.image} alt={right.title} className="mb-3 h-20 w-full rounded-md object-cover" />
          <h3 className="text-sm font-semibold">{right.title}</h3>
          <p className="mt-2 text-xs text-gray-500">{right.excerpt}</p>
          <button onClick={() => setModalArticle(right)} className="mt-3 inline-block text-xs text-indigo-600">
            Read more →
          </button>
        </article>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        {articles.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full ${i === index ? "bg-indigo-500" : "bg-indigo-100"}`}
          ></button>
        ))}
      </div>

      <ArticleModal article={modalArticle} onClose={() => setModalArticle(null)} />
    </div>
  );
}
