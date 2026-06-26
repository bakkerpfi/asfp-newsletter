"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function IssuesPage() {
  const [title, setTitle] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("2026");
  const [summary, setSummary] = useState("");

  const [issues, setIssues] = useState<any[]>([]);

  async function loadIssues() {
    const response = await fetch("/api/issues");
    const data = await response.json();
    setIssues(data);
  }

  async function saveIssue() {
    await fetch("/api/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        issue_number: issueNumber,
        month,
        year,
        summary,
      }),
    });

    loadIssues();
  }

  useEffect(() => {
    loadIssues();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 p-10 bg-slate-100">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Newsletter Issues
        </h1>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <div className="grid gap-4">

            <input
              className="border rounded p-3"
              placeholder="Title"
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Issue Number"
              onChange={(e) => setIssueNumber(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Month"
              onChange={(e) => setMonth(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />

            <textarea
              className="border rounded p-3"
              placeholder="Summary"
              onChange={(e) => setSummary(e.target.value)}
            />

            <button
              onClick={saveIssue}
              className="rounded bg-red-500 px-6 py-3 text-white"
            >
              Create Issue
            </button>

          </div>

        </div>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <h2 className="mb-4 text-2xl font-bold">
            Existing Issues
          </h2>

          {issues.map((issue) => (
            <div
              key={issue.id}
              className="mb-4 rounded border p-4"
            >
              <h3 className="font-bold">
                {issue.title}
              </h3>

              <p>
                Issue {issue.issue_number}
              </p>

              <p>
                {issue.month} {issue.year}
              </p>
              <button
  onClick={async () => {
    if (
      !confirm(
        "Delete this issue and all associated articles and polls?"
      )
    ) {
      return;
    }

    await fetch("/api/issues/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: issue.id,
      }),
    });

    window.location.reload();
  }}
  className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
>
  Delete Issue
</button>
            </div>
          ))}

        </div>

      </main>
    </div>
  );
}