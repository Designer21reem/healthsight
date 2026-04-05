import React from "react";
import ArticlesClient from "../../components/Articles/ArticlesClient";

export default function ArticlesPage() {
  return (
    <div className="mx-auto max-w-7xl pt-10 px-6 pb-0">
      {/* ✅ مسافة تحت الهيدر sticky */}
      <main className="mx-auto max-w-7xl px-6 pb-16">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">Explore Our Health Articles</h1>
          <p className="mt-2 text-gray-600">
            Stay informed with trusted AI-curated articles on health, wellness, and disease prevention.
          </p>
        </div>

        <div className="relative mt-12">
          <ArticlesClient />
        </div>
      </main>
    </div>
  );
}
