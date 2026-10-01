"use client";

import {
  useEffect,
  useState,
} from "react";

type Company = {
  id: string;
  name: string;
  slug: string;
  primary_colour: string;
  secondary_colour: string;
};

type Issue = {
  id: number;
  company_id: string;
  title: string | null;
  issue_number: string | null;
  month: string | null;
  year: number | null;
};

type Article = {
  id: number;
  company_id: string;
  issue_id: number | null;
  title: string | null;
  category: string | null;
  author: string | null;
  content: string | null;
};

type Props = {
  currentCompany: Company;
};

export default function ArticlesManager({
  currentCompany,
}: Props) {
  const [issues, setIssues] =
    useState<Issue[]>([]);

  const [articles, setArticles] =
    useState<Article[]>([]);

  const [issueId, setIssueId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [author, setAuthor] =
    useState("");

  const [content, setContent] =
    useState("");

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD COMPANY DATA
  // =====================================================

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        issuesResponse,
        articlesResponse,
      ] = await Promise.all([
        fetch(
          `/api/issues?company=${encodeURIComponent(
            currentCompany.slug
          )}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/articles?company=${encodeURIComponent(
            currentCompany.slug
          )}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      const issuesResult =
        await issuesResponse.json();

      const articlesResult =
        await articlesResponse.json();

      if (!issuesResponse.ok) {
        throw new Error(
          issuesResult.error ||
            "Unable to load issues."
        );
      }

      if (!articlesResponse.ok) {
        throw new Error(
          articlesResult.error ||
            "Unable to load articles."
        );
      }

      const companyIssues =
        Array.isArray(issuesResult)
          ? issuesResult
          : [];

      const companyArticles =
        Array.isArray(articlesResult)
          ? articlesResult
          : [];

      setIssues(companyIssues);
      setArticles(companyArticles);

      setIssueId(
        (currentIssueId) => {
          const stillExists =
            companyIssues.some(
              (issue: Issue) =>
                String(issue.id) ===
                currentIssueId
            );

          if (stillExists) {
            return currentIssueId;
          }

          return companyIssues.length >
            0
            ? String(
                companyIssues[0].id
              )
            : "";
        }
      );
    } catch (err) {
      console.error(
        "LOAD ARTICLE DATA ERROR:",
        err
      );

      setIssues([]);
      setArticles([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load article data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    resetForm();
    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany.slug]);

  // =====================================================
  // RESET
  // =====================================================

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("");
    setAuthor("");
    setContent("");
  }

  // =====================================================
  // SAVE
  // =====================================================

  async function saveArticle() {
    if (!issueId) {
      alert(
        "Create or select a newsletter issue first."
      );
      return;
    }

    if (!title.trim()) {
      alert(
        "Please enter an article title."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? "/api/articles/update"
          : "/api/articles",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            companySlug:
              currentCompany.slug,

            id: editingId,

            issue_id:
              Number(issueId),

            title,
            category,
            author,
            content,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Unable to save article."
        );
        return;
      }

      resetForm();

      await loadData();
    } catch (err) {
      console.error(
        "SAVE ARTICLE ERROR:",
        err
      );

      alert(
        "Unable to save article."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // EDIT
  // =====================================================

  function editArticle(
    article: Article
  ) {
    setEditingId(article.id);

    setIssueId(
      String(
        article.issue_id ?? ""
      )
    );

    setTitle(
      article.title ?? ""
    );

    setCategory(
      article.category ?? ""
    );

    setAuthor(
      article.author ?? ""
    );

    setContent(
      article.content ?? ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function deleteArticle(
    article: Article
  ) {
    const confirmed =
      confirm(
        `Delete "${article.title}" from ${currentCompany.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/articles/delete",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: article.id,

            companySlug:
              currentCompany.slug,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Unable to delete article."
        );
        return;
      }

      if (
        editingId === article.id
      ) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      console.error(
        "DELETE ARTICLE ERROR:",
        err
      );

      alert(
        "Unable to delete article."
      );
    }
  }

  // =====================================================
  // ISSUE LABEL
  // =====================================================

  function getIssueLabel(
    articleIssueId:
      number | null
  ) {
    const issue =
      issues.find(
        (item) =>
          item.id ===
          articleIssueId
      );

    if (!issue) {
      return "Unknown issue";
    }

    return `Issue ${
      issue.issue_number ?? ""
    } – ${issue.title ?? ""}`;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* CREATE / EDIT */}

      <div className="mt-8 rounded-xl bg-white p-8 shadow">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h2
              className="text-2xl font-bold"
              style={{
                color:
                  currentCompany.primary_colour,
              }}
            >
              {editingId
                ? "Edit Article"
                : "Create Article"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Article for{" "}
              <strong>
                {currentCompany.name}
              </strong>
              .
            </p>

          </div>

          <div className="rounded-lg bg-slate-100 px-4 py-3">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Company
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {currentCompany.name}
            </p>

          </div>

        </div>

        {issues.length === 0 ? (

          <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-5 text-orange-800">

            Create a newsletter issue
            for {currentCompany.name} before
            adding articles.

          </div>

        ) : (

          <div className="mt-6 grid gap-4">

            <select
              className="rounded border p-3"
              value={issueId}
              onChange={(event) =>
                setIssueId(
                  event.target.value
                )
              }
            >
              {issues.map(
                (issue) => (

                  <option
                    key={issue.id}
                    value={issue.id}
                  >
                    Issue{" "}
                    {
                      issue.issue_number
                    }{" "}
                    – {issue.title}
                  </option>

                )
              )}
            </select>

            <input
              className="rounded border p-3"
              placeholder="Article Title"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
            />

            <div className="grid gap-4 md:grid-cols-2">

              <input
                className="rounded border p-3"
                placeholder="Category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              />

              <input
                className="rounded border p-3"
                placeholder="Author"
                value={author}
                onChange={(event) =>
                  setAuthor(
                    event.target.value
                  )
                }
              />

            </div>

            <textarea
              rows={10}
              className="rounded border p-3"
              placeholder="Article Content"
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
            />

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={saveArticle}
                disabled={saving}
                className="rounded px-6 py-3 font-semibold text-white disabled:opacity-50"
                style={{
                  backgroundColor:
                    currentCompany.secondary_colour,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Article"
                  : "Save Article"}
              </button>

              {editingId && (

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded bg-slate-500 px-6 py-3 font-semibold text-white hover:bg-slate-600"
                >
                  Cancel
                </button>

              )}

            </div>

          </div>

        )}

      </div>

      {/* ARTICLES */}

      <div className="mt-8 rounded-xl bg-white p-8 shadow">

        <h2
          className="text-2xl font-bold"
          style={{
            color:
              currentCompany.primary_colour,
          }}
        >
          Articles
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {articles.length} article
          {articles.length === 1
            ? ""
            : "s"}{" "}
          for {currentCompany.name}
        </p>

        {error && (

          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>

        )}

        {loading ? (

          <p className="mt-6 text-slate-500">
            Loading articles...
          </p>

        ) : articles.length === 0 ? (

          <p className="mt-6 text-slate-500">
            No articles found for{" "}
            {currentCompany.name}.
          </p>

        ) : (

          <div className="mt-6 space-y-4">

            {articles.map(
              (article) => (

                <div
                  key={article.id}
                  className="rounded-lg border p-5"
                >

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {getIssueLabel(
                      article.issue_id
                    )}
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    {article.title}
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">

                    {article.category && (
                      <span>
                        {
                          article.category
                        }
                      </span>
                    )}

                    {article.author && (
                      <span>
                        By{" "}
                        {article.author}
                      </span>
                    )}

                  </div>

                  {article.content && (

                    <p className="mt-4 whitespace-pre-wrap text-slate-700">
                      {article.content}
                    </p>

                  )}

                  <div className="mt-4 flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        editArticle(
                          article
                        )
                      }
                      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteArticle(
                          article
                        )
                      }
                      className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>
    </>
  );
}