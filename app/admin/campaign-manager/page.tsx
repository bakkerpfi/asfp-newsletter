"use client";

import { useEffect, useState } from "react";

type Batch = {
  batch: number;
  start: number;
  end: number;
  count: number;
  sent: number;
  remaining: number;
  complete: boolean;
};

type CampaignData = {
  issue: {
    id: number;
    issue_number: number;
    title: string;
  };
  totalSubscribers: number;
  totalSent: number;
  totalRemaining: number;
  batchSize: number;
  batches: Batch[];
};

export default function CampaignManagerPage() {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] =
    useState<CampaignData | null>(null);

  useEffect(() => {
    loadCampaign();
  }, []);

  async function loadCampaign() {
    setLoading(true);

    const response = await fetch(
      "/api/campaign-manager"
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error ?? "Unable to load campaign.");
      setLoading(false);
      return;
    }

    setCampaign(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl p-10">
        <h1 className="text-3xl font-bold">
          Email Campaign Manager
        </h1>

        <p className="mt-6">
          Loading campaign...
        </p>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="mx-auto max-w-7xl p-10">
        <h1 className="text-3xl font-bold">
          Email Campaign Manager
        </h1>

        <p className="mt-6">
          No campaign found.
        </p>
      </main>
    );
  }

  const progress =
    campaign.totalSubscribers === 0
      ? 0
      : Math.round(
          (campaign.totalSent /
            campaign.totalSubscribers) *
            100
        );

  return (
    <main className="mx-auto max-w-7xl p-10">

      <div className="mb-8">

        <h1 className="text-4xl font-bold">
          Email Campaign Manager
        </h1>

        <p className="mt-2 text-gray-600">
          Monitor newsletter campaigns,
          resume interrupted sends and
          recover failed batches.
        </p>

      </div>

      {/* Campaign Summary */}

      <div className="mb-8 rounded-lg border bg-white p-6 shadow">

        <h2 className="text-2xl font-bold">
          Issue {campaign.issue.issue_number}
        </h2>

        <p className="mt-1 text-gray-600">
          {campaign.issue.title}
        </p>

        <div className="mt-6 grid grid-cols-4 gap-6">

          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">
              Total Subscribers
            </div>

            <div className="mt-2 text-3xl font-bold">
              {campaign.totalSubscribers}
            </div>
          </div>

          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">
              Sent
            </div>

            <div className="mt-2 text-3xl font-bold text-green-600">
              {campaign.totalSent}
            </div>
          </div>

          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">
              Remaining
            </div>

            <div className="mt-2 text-3xl font-bold text-red-600">
              {campaign.totalRemaining}
            </div>
          </div>

          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">
              Progress
            </div>

            <div className="mt-2 text-3xl font-bold text-blue-600">
              {progress}%
            </div>
          </div>

        </div>

        <div className="mt-6 h-5 overflow-hidden rounded bg-gray-200">

          <div
            className="h-5 bg-green-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* Batch Table */}

      <div className="rounded-lg border bg-white shadow">

        <div className="border-b p-6">

          <h2 className="text-2xl font-bold">
            Campaign Batches
          </h2>

        </div>

        <table className="min-w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="px-4 py-3 text-left">
                Batch
              </th>

              <th className="px-4 py-3 text-left">
                Subscribers
              </th>

              <th className="px-4 py-3 text-center">
                Sent
              </th>

              <th className="px-4 py-3 text-center">
                Remaining
              </th>

              <th className="px-4 py-3 text-center">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {campaign.batches.map((batch) => {

              let status =
                "Not Started";

              let colour =
                "text-red-600";

              if (batch.complete) {

                status =
                  "Complete";

                colour =
                  "text-green-600";

              } else if (
                batch.sent > 0
              ) {

                status =
                  "Partial";

                colour =
                  "text-orange-500";

              }

              return (

                <tr
                  key={batch.batch}
                  className="border-t"
                >

                  <td className="px-4 py-3 font-semibold">

                    Batch {batch.batch}

                  </td>

                  <td className="px-4 py-3">

                    {batch.start} - {batch.end}

                  </td>

                  <td className="px-4 py-3 text-center">

                    {batch.sent}

                  </td>

                  <td className="px-4 py-3 text-center">

                    {batch.remaining}

                  </td>

                  <td
                    className={`px-4 py-3 text-center font-bold ${colour}`}
                  >

                    {status}

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

      {/* Buttons */}

      <div className="mt-8 flex gap-4">

        <button
          onClick={() =>
            alert(
              "Resume Campaign coming next..."
            )
          }
          className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Resume Campaign
        </button>

        <button
          onClick={() =>
            loadCampaign()
          }
          className="rounded bg-gray-700 px-6 py-3 text-white hover:bg-gray-800"
        >
          Refresh
        </button>

      </div>

    </main>
  );
}