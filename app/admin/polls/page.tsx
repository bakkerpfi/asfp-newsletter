"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function PollsPage() {
  const [question, setQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");

  const [polls, setPolls] = useState<any[]>([]);

  async function loadPolls() {
    const response = await fetch("/api/polls");
    const data = await response.json();

    setPolls(data);
  }

  async function savePoll() {
    await fetch("/api/polls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issue_id: 4,
        question,
        option1,
        option2,
        option3,
      }),
    });

    setQuestion("");
    setOption1("");
    setOption2("");
    setOption3("");

    loadPolls();
  }

  useEffect(() => {
    loadPolls();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">
        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Polls
        </h1>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">
          <div className="grid gap-4">

            <input
              className="border rounded p-3"
              placeholder="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Option 1"
              value={option1}
              onChange={(e) => setOption1(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Option 2"
              value={option2}
              onChange={(e) => setOption2(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Option 3"
              value={option3}
              onChange={(e) => setOption3(e.target.value)}
            />

            <button
              onClick={savePoll}
              className="rounded bg-red-500 px-6 py-3 text-white hover:bg-red-600"
            >
              Create Poll
            </button>

          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <h2 className="mb-4 text-2xl font-bold">
            Poll Results
          </h2>

          {polls.length === 0 && (
            <p className="text-slate-500">
              No polls found.
            </p>
          )}

          {polls.map((poll) => {
            const total =
              poll.votes1 +
              poll.votes2 +
              poll.votes3;

            return (
              <div
                key={poll.id}
                className="mb-6 rounded border p-4"
              >
                <h3 className="text-lg font-bold">
                  {poll.question}
                </h3>

                <div className="mt-4 space-y-2">

                  <div>
                    {poll.option1}
                    <span className="ml-2 text-slate-500">
                      ({poll.votes1} votes)
                    </span>
                  </div>

                  <div>
                    {poll.option2}
                    <span className="ml-2 text-slate-500">
                      ({poll.votes2} votes)
                    </span>
                  </div>

                  <div>
                    {poll.option3}
                    <span className="ml-2 text-slate-500">
                      ({poll.votes3} votes)
                    </span>
                  </div>

                </div>

                <p className="mt-4 text-sm text-slate-500">
                  Total Votes: {total}
                </p>

                <button
                  onClick={async () => {
                    if (!confirm("Delete this poll?")) {
                      return;
                    }

                    await fetch("/api/polls/delete", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        id: poll.id,
                      }),
                    });

                    loadPolls();
                  }}
                  className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  Delete Poll
                </button>

              </div>
            );
          })}

        </div>
      </main>
    </div>
  );
}