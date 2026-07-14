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
  const [selected, setSelected] = useState<Subscriber | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];

    return subscribers.filter((s) =>
      `${s.name} ${s.company} ${s.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, subscribers]);

  async function copyLink(subscriber: Subscriber) {
    const link = `${websiteUrl}/newsletter/${issueId}?u=${subscriber.unsubscribe_token}`;

    await navigator.clipboard.writeText(link);

    alert("Personal newsletter link copied.");
  }

  const selectedLink = selected
    ? `${websiteUrl}/newsletter/${issueId}?u=${selected.unsubscribe_token}`
    : "";

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
        onChange={(e) => {
          setSearch(e.target.value);
          setSelected(null);
        }}
        placeholder="Search subscriber..."
        className="mt-6 w-full rounded border p-3"
      />

      <div className="mt-6">

        {!selected && filtered.length > 0 && (

          <div className="rounded border bg-white">

            {filtered.map((subscriber) => (

              <button
                key={subscriber.id}
                onClick={() => setSelected(subscriber)}
                className="block w-full border-b p-4 text-left hover:bg-slate-100"
              >
                <p className="font-semibold">
                  {subscriber.name}
                </p>

                <p className="text-sm text-slate-500">
                  {subscriber.company}
                </p>

                <p className="text-sm text-slate-400">
                  {subscriber.email}
                </p>

              </button>

            ))}

          </div>

        )}

        {selected && (

          <div className="rounded border bg-white p-6">

            <p className="text-xl font-semibold">
              {selected.name}
            </p>

            <p className="text-slate-600">
              {selected.company}
            </p>

            <p className="text-slate-500">
              {selected.email}
            </p>

            <p className="mt-4 break-all rounded bg-slate-100 p-3 text-xs text-slate-500">
              {selectedLink}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              <a
                href={selectedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Preview
              </a>

              <button
                onClick={() => copyLink(selected)}
                className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
              >
                Copy Link
              </button>

              <button
                onClick={() => {
                  setSelected(null);
                  setSearch("");
                }}
                className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-700"
              >
                Search Again
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}