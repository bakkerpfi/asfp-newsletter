"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";

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
  summary: string | null;
  published: boolean | null;
};

type Props = {
  currentCompany: Company;
};

export default function IssuesManager({
  currentCompany,
}: Props) {
  const [title, setTitle] =
    useState("");

  const [
    issueNumber,
    setIssueNumber,
  ] = useState("");

  const [month, setMonth] =
    useState("");

  const [year, setYear] =
    useState(
      String(
        new Date().getFullYear()
      )
    );

  const [summary, setSummary] =
    useState("");

  const [issues, setIssues] =
    useState<Issue[]>([]);

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
  // LOAD ISSUES
  // =====================================================

  async function loadIssues() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/issues?company=${encodeURIComponent(
          currentCompany.slug
        )}`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load issues."
        );
      }

      setIssues(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (err) {
      console.error(
        "LOAD ISSUES ERROR:",
        err
      );

      setIssues([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load issues."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany.slug]);

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setIssueNumber("");
    setMonth("");
    setYear(
      String(
        new Date().getFullYear()
      )
    );
    setSummary("");
  }

  // =====================================================
  // SAVE ISSUE
  // =====================================================

  async function saveIssue() {
    if (!title.trim()) {
      alert(
        "Please enter an issue title."
      );
      return;
    }

    if (!issueNumber.trim()) {
      alert(
        "Please enter an issue number."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/issues",
        {
          method:
            editingId
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            companySlug:
              currentCompany.slug,

            id:
              editingId,

            title,

            issue_number:
              issueNumber,

            month,

            year,

            summary,
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
            "Unable to save issue."
        );
        return;
      }

      resetForm();

      await loadIssues();
    } catch (err) {
      console.error(
        "SAVE ISSUE ERROR:",
        err
      );

      alert(
        "Unable to save issue."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // EDIT
  // =====================================================

  function editIssue(
    issue: Issue
  ) {
    setEditingId(issue.id);

    setTitle(
      issue.title ?? ""
    );

    setIssueNumber(
      String(
        issue.issue_number ?? ""
      )
    );

    setMonth(
      issue.month ?? ""
    );

    setYear(
      String(
        issue.year ??
          new Date().getFullYear()
      )
    );

    setSummary(
      issue.summary ?? ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function deleteIssue(
    issue: Issue
  ) {
    const confirmed =
      confirm(
        `Delete "${issue.title}" and all associated articles and polls from ${currentCompany.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/issues/delete",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id:
              issue.id,

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
            "Unable to delete issue."
        );
        return;
      }

      if (
        editingId === issue.id
      ) {
        resetForm();
      }

      await loadIssues();
    } catch (err) {
      console.error(
        "DELETE ISSUE ERROR:",
        err
      );

      alert(
        "Unable to delete issue."
      );
    }
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
                ? "Edit Issue"
                : "Create Issue"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Newsletter issue for{" "}
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

        <div className="mt-6 grid gap-4">

          <input
            className="rounded border p-3"
            placeholder="Title"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
          />

          <div className="grid gap-4 md:grid-cols-3">

            <input
              className="rounded border p-3"
              placeholder="Issue Number"
              value={issueNumber}
              onChange={(event) =>
                setIssueNumber(
                  event.target.value
                )
              }
            />

            <input
              className="rounded border p-3"
              placeholder="Month"
              value={month}
              onChange={(event) =>
                setMonth(
                  event.target.value
                )
              }
            />

            <input
              className="rounded border p-3"
              placeholder="Year"
              value={year}
              onChange={(event) =>
                setYear(
                  event.target.value
                )
              }
            />

          </div>

          <textarea
            rows={5}
            className="rounded border p-3"
            placeholder="Summary"
            value={summary}
            onChange={(event) =>
              setSummary(
                event.target.value
              )
            }
          />

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={saveIssue}
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
                ? "Save Changes"
                : "Create Issue"}
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

      </div>

      {/* EXISTING ISSUES */}

      <div className="mt-8 rounded-xl bg-white p-8 shadow">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2
              className="text-2xl font-bold"
              style={{
                color:
                  currentCompany.primary_colour,
              }}
            >
              Existing Issues
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {issues.length} issue
              {issues.length === 1
                ? ""
                : "s"}{" "}
              for{" "}
              {currentCompany.name}
            </p>
          </div>

        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-6 text-slate-500">
            Loading issues...
          </p>

        ) : issues.length === 0 ? (

          <p className="mt-6 text-slate-500">
            No issues found for{" "}
            {currentCompany.name}.
          </p>

        ) : (

          <div className="mt-6 space-y-4">

            {issues.map(
              (issue) => (

                <div
                  key={issue.id}
                  className="rounded-lg border p-5"
                >

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>

                      <h3 className="text-lg font-bold">
                        {issue.title}
                      </h3>

                      <p className="mt-1 text-slate-600">
                        Issue{" "}
                        {
                          issue.issue_number
                        }
                      </p>

                      <p className="text-slate-600">
                        {issue.month}{" "}
                        {issue.year}
                      </p>

                      {issue.summary && (
                        <p className="mt-3 max-w-3xl text-sm text-slate-500">
                          {issue.summary}
                        </p>
                      )}

                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/issues/${issue.id}?company=${encodeURIComponent(currentCompany.slug)}`} className="rounded bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800">Open Newsletter</Link>

                      <button
                        type="button"
                        onClick={() =>
                          editIssue(
                            issue
                          )
                        }
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteIssue(
                            issue
                          )
                        }
                        className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                      >
                        Delete
                      </button>

                    </div>

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
