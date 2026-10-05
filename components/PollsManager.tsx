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
};

type Poll = {
  id: number;
  company_id: string;
  issue_id: number | null;
  question: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  votes1: number | null;
  votes2: number | null;
  votes3: number | null;
  active: boolean | null;
};

type Props = {
  currentCompany: Company;
};

export default function PollsManager({
  currentCompany,
}: Props) {
  const [issues, setIssues] =
    useState<Issue[]>([]);

  const [polls, setPolls] =
    useState<Poll[]>([]);

  const [issueId, setIssueId] =
    useState("");

  const [question, setQuestion] =
    useState("");

  const [option1, setOption1] =
    useState("");

  const [option2, setOption2] =
    useState("");

  const [option3, setOption3] =
    useState("");

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
        pollsResponse,
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
          `/api/polls?company=${encodeURIComponent(
            currentCompany.slug
          )}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      const issuesResult =
        await issuesResponse.json();

      const pollsResult =
        await pollsResponse.json();

      if (!issuesResponse.ok) {
        throw new Error(
          issuesResult.error ||
            "Unable to load issues."
        );
      }

      if (!pollsResponse.ok) {
        throw new Error(
          pollsResult.error ||
            "Unable to load polls."
        );
      }

      const companyIssues =
        Array.isArray(issuesResult)
          ? issuesResult
          : [];

      const companyPolls =
        Array.isArray(pollsResult)
          ? pollsResult
          : [];

      setIssues(companyIssues);
      setPolls(companyPolls);

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

          return companyIssues.length > 0
            ? String(
                companyIssues[0].id
              )
            : "";
        }
      );
    } catch (err) {
      console.error(
        "LOAD POLL DATA ERROR:",
        err
      );

      setIssues([]);
      setPolls([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load poll data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setQuestion("");
    setOption1("");
    setOption2("");
    setOption3("");

    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany.slug]);

  // =====================================================
  // CREATE POLL
  // =====================================================

  async function savePoll() {
    if (!issueId) {
      alert(
        "Create or select a newsletter issue first."
      );
      return;
    }

    if (
      !question.trim() ||
      !option1.trim() ||
      !option2.trim()
    ) {
      alert(
        "Please enter a question and at least two options."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/polls",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            companySlug:
              currentCompany.slug,

            issue_id:
              Number(issueId),

            question,
            option1,
            option2,
            option3,
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
            "Unable to create poll."
        );
        return;
      }

      setQuestion("");
      setOption1("");
      setOption2("");
      setOption3("");

      await loadData();
    } catch (err) {
      console.error(
        "CREATE POLL ERROR:",
        err
      );

      alert(
        "Unable to create poll."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE POLL
  // =====================================================

  async function deletePoll(
    poll: Poll
  ) {
    if (
      !confirm(
        `Delete "${poll.question}" from ${currentCompany.name}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        "/api/polls/delete",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: poll.id,

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
            "Unable to delete poll."
        );
        return;
      }

      await loadData();
    } catch (err) {
      console.error(
        "DELETE POLL ERROR:",
        err
      );

      alert(
        "Unable to delete poll."
      );
    }
  }

  // =====================================================
  // ISSUE LABEL
  // =====================================================

  function issueLabel(
    pollIssueId: number | null
  ) {
    const issue =
      issues.find(
        (item) =>
          item.id === pollIssueId
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
              Create Poll
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Poll for{" "}
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
            adding a poll.
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
              placeholder="Question"
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
            />

            <div className="grid gap-4 md:grid-cols-3">

              <input
                className="rounded border p-3"
                placeholder="Option 1"
                value={option1}
                onChange={(event) =>
                  setOption1(
                    event.target.value
                  )
                }
              />

              <input
                className="rounded border p-3"
                placeholder="Option 2"
                value={option2}
                onChange={(event) =>
                  setOption2(
                    event.target.value
                  )
                }
              />

              <input
                className="rounded border p-3"
                placeholder="Option 3 (optional)"
                value={option3}
                onChange={(event) =>
                  setOption3(
                    event.target.value
                  )
                }
              />

            </div>

            <button
              type="button"
              onClick={savePoll}
              disabled={saving}
              className="w-fit rounded px-6 py-3 font-semibold text-white disabled:opacity-50"
              style={{
                backgroundColor:
                  currentCompany.secondary_colour,
              }}
            >
              {saving
                ? "Creating..."
                : "Create Poll"}
            </button>

          </div>

        )}

      </div>

      {/* RESULTS */}

      <div className="mt-8 rounded-xl bg-white p-8 shadow">

        <h2
          className="text-2xl font-bold"
          style={{
            color:
              currentCompany.primary_colour,
          }}
        >
          Poll Results
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {polls.length} poll
          {polls.length === 1
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
            Loading polls...
          </p>

        ) : polls.length === 0 ? (

          <p className="mt-6 text-slate-500">
            No polls found for{" "}
            {currentCompany.name}.
          </p>

        ) : (

          <div className="mt-6 space-y-4">

            {polls.map((poll) => {
              const votes1 =
                poll.votes1 ?? 0;

              const votes2 =
                poll.votes2 ?? 0;

              const votes3 =
                poll.votes3 ?? 0;

              const total =
                votes1 +
                votes2 +
                votes3;

              return (
                <div
                  key={poll.id}
                  className="rounded-lg border p-5"
                >

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {issueLabel(
                      poll.issue_id
                    )}
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    {poll.question}
                  </h3>

                  <div className="mt-4 space-y-2">

                    <div>
                      {poll.option1}
                      <span className="ml-2 text-slate-500">
                        ({votes1} votes)
                      </span>
                    </div>

                    <div>
                      {poll.option2}
                      <span className="ml-2 text-slate-500">
                        ({votes2} votes)
                      </span>
                    </div>

                    {poll.option3 && (
                      <div>
                        {poll.option3}
                        <span className="ml-2 text-slate-500">
                          ({votes3} votes)
                        </span>
                      </div>
                    )}

                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Total Votes: {total}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      deletePoll(poll)
                    }
                    className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    Delete Poll
                  </button>

                </div>
              );
            })}

          </div>

        )}

      </div>
    </>
  );
}