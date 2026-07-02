"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function ArticlesPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [issueId, setIssueId] = useState("");
const [issues, setIssues] = useState<any[]>([]);

  const [articles, setArticles] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadIssues() {
  const response = await fetch("/api/issues");
  const data = await response.json();

  setIssues(data);

  if (data.length > 0) {
    setIssueId(String(data[0].id));
  }
}

  async function loadArticles() {
    const response = await fetch("/api/articles");
    const data = await response.json();

    setArticles(data);
  }

async function saveArticle() {
  const url = editingId
    ? "/api/articles/update"
    : "/api/articles";

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: editingId,
      issue_id: Number(issueId),
      title,
      category,
      author,
      content,
    }),
  });

  setTitle("");
  setCategory("");
  setAuthor("");
  setContent("");
  setEditingId(null);

  loadArticles();
}

useEffect(() => {
  loadArticles();
  loadIssues();
}, []);

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Articles
        </h1>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

<div className="grid gap-4">

  <select
    className="border rounded p-3"
    value={issueId}
    onChange={(e) => setIssueId(e.target.value)}
  >
    {issues.map((issue) => (
      <option
        key={issue.id}
        value={issue.id}
      >
        Issue {issue.issue_number} - {issue.title}
      </option>
    ))}
  </select>

  <input
    className="border rounded p-3"
    placeholder="Article Title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />

  <input
    className="border rounded p-3"
    placeholder="Category"
    value={category}
    onChange={(e) => setCategory(e.target.value)}
  />

  <input
    className="border rounded p-3"
    placeholder="Author"
    value={author}
    onChange={(e) => setAuthor(e.target.value)}
  />

  <textarea
    className="border rounded p-3 h-40"
    placeholder="Article Content"
    value={content}
    onChange={(e) => setContent(e.target.value)}
  />

<button
  onClick={saveArticle}
  className="rounded bg-red-500 px-6 py-3 text-white"
>
  {editingId
    ? "Update Article"
    : "Save Article"}
</button>

          </div>

        </div>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <h2 className="mb-4 text-2xl font-bold">
            Articles
          </h2>

          {articles.map((article) => (
            <div
              key={article.id}
              className="mb-4 rounded border p-4"
            >
              <h3 className="font-bold">
                {article.title}
              </h3>

              <p className="text-sm text-slate-500">
                {article.category}
              </p>

              <p className="mt-2">
                {article.content}
              </p>

<button
  onClick={() => {
    setEditingId(article.id);
    setIssueId(String(article.issue_id));
    setTitle(article.title);
    setCategory(article.category);
    setAuthor(article.author);
    setContent(article.content);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
  className="mr-2 mt-3 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
>
  Edit
</button>

              <button
  onClick={async () => {
    await fetch("/api/articles/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: article.id,
      }),
    });

    window.location.reload();
  }}
  className="mt-3 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
>
  Delete
</button>
            </div>
            
          ))}

        </div>

      </main>
    </div>
  );
}