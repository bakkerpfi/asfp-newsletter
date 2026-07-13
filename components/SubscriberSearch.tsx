"use client";

import { useMemo, useState } from "react";

type Subscriber = {
  id: number;
  name: string;
  company: string;
  email: string;
  unsubscribe_token: string;
};

type Props = {
  subscribers: Subscriber[];
  issueId: number;
  websiteUrl: string;
};

export default function SubscriberSearch({
  subscribers,
  issueId,
  websiteUrl,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return subscribers.slice(0, 20);

    return subscribers
      .filter((s) =>
        `${s.name} ${s.company} ${s.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .slice(0, 20);
  }, [search, subscribers]);

  async function copyLink(subscriber: Subscriber) {
    const link =
      `${websiteUrl}/newsletter/${issueId}?u=${subscriber.unsubscribe_token}`;

    await navigator.clipboard.writeText(link);

    alert("Personal newsletter link copied.");
  }

  return (
    <div className="mt-8 rounded-xl bg-white p-8 shadow">

      <h2 className="text-2xl font-bold text-[#1E2D5A]">
        Subscriber Search
      </h2>

      <p className="mt-2 text-slate-500">
        Search by name, company or email.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search subscriber..."
        className="mt-6 w-full rounded border p-3"
      />

      <div className="mt-6 space-y-3">

        {filtered.map((subscriber) => {

          const link =
            `${websiteUrl}/newsletter/${issueId}?u=${subscriber.unsubscribe_token}`;

          return (

            <div
              key={subscriber.id}
              className="flex items-center justify-between rounded border bg-white p-4"
            >

              <div>

                <p className="font-semibold">
                  {subscriber.name}
                </p>

                <p className="text-sm text-slate-500">
                  {subscriber.company}
                </p>

                <p className="text-sm text-slate-500">
                  {subscriber.email}
                </p>

                <p className="mt-2 break-all text-xs text-slate-400">
  {link}
</p>

              </div>

              <div className="flex gap-3">

                <a
                  href={link}
                  target="_blank"
                  className="rounded bg-green-600 px-4 py-2 text-white"
                >
                  Preview
                </a>

                <button
                  onClick={() => copyLink(subscriber)}
                  className="rounded bg-blue-700 px-4 py-2 text-white"
                >
                  Copy Link
                </button>

              </div>

            </div>

          );
        })}

      </div>

    </div>
  );
}