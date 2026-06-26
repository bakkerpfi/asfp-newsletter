"use client";

import { useState } from "react";

export default function PollCard({
  poll,
}: {
  poll: any;
}) {
  const [voted, setVoted] = useState(false);

  async function vote(option: number) {
    await fetch("/api/polls/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pollId: poll.id,
        option,
      }),
    });

    setVoted(true);
  }

  return (
    <div className="rounded-xl border border-[#CBD5E1] p-6">

      <h3 className="mb-4 text-2xl font-bold text-[#1E2D5A]">
        Industry Poll
      </h3>

      <p className="mb-6 text-[#334155]">
        {poll.question}
      </p>

      {!voted ? (
        <div className="space-y-3">

          <button
            onClick={() => vote(1)}
            className="block w-full rounded border border-[#CBD5E1] p-3 text-left hover:bg-[#F1F5F9]"
          >
            {poll.option1}
          </button>

          <button
            onClick={() => vote(2)}
            className="block w-full rounded border border-[#CBD5E1] p-3 text-left hover:bg-[#F1F5F9]"
          >
            {poll.option2}
          </button>

          <button
            onClick={() => vote(3)}
            className="block w-full rounded border border-[#CBD5E1] p-3 text-left hover:bg-[#F1F5F9]"
          >
            {poll.option3}
          </button>

        </div>
      ) : (
        <div className="rounded bg-[#DCFCE7] p-4 text-[#15803D]">
          Thank you for voting.
        </div>
      )}

    </div>
  );
}