"use client";

import { useEffect, useState } from "react";

export default function CampaignRecoveryPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [matched, setMatched] = useState<any[]>([]);
  const [showMatched, setShowMatched] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const res = await fetch("/api/campaign-recovery/inspect");
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMatched() {
    try {
      const res = await fetch("/api/campaign-recovery/matched");
      const data = await res.json();

      setMatched(data.subscribers ?? []);
      setShowMatched(true);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <main className="p-10">
        Loading...
      </main>
    );
  }

  async function sendRecovery() {

  if (
    !confirm(
      `Send recovery emails to ${summary.matchedSubscribers} subscribers?`
    )
  ) {
    return;
  }

  try {

    setSending(true);

    const res = await fetch(
      "/api/campaign-recovery/send",
      {
        method: "POST",
      }
    );

    const data = await res.json();

    console.log(data);

    alert(
      JSON.stringify(data, null, 2)
    );

  } catch (err) {

    console.error(err);

    alert("Recovery send failed.");

  } finally {

    setSending(false);

  }

}

  return (
    <main className="max-w-4xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        Campaign Recovery
      </h1>

      <p className="text-gray-600 mb-8">
        Recover subscribers affected by the Resend HTTP 429 rate limit.
      </p>

      <div className="border rounded-lg p-6 bg-white shadow">

        <table className="w-full">
          <tbody>

            <tr>
              <td className="py-2 font-medium">CSV Log IDs</td>
              <td>{summary.csvLogIds}</td>
            </tr>

            <tr>
              <td className="py-2 font-medium">Recovered Recipients</td>
              <td>{summary.logsRetrieved}</td>
            </tr>

            <tr>
              <td className="py-2 font-medium">Unique Emails</td>
              <td>{summary.uniqueEmails}</td>
            </tr>

            <tr>
              <td className="py-2 font-medium">Matched Subscribers</td>
              <td>{summary.matchedSubscribers}</td>
            </tr>

            <tr>
              <td className="py-2 font-medium">Unmatched Emails</td>
              <td>{summary.unmatchedEmails}</td>
            </tr>

          </tbody>
        </table>

      </div>

      <div className="mt-8 flex gap-4">

        <button
          onClick={loadMatched}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
        >
          View Matched
        </button>

        <button
          className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded"
        >
          View Unmatched
        </button>

      </div>

      {showMatched && (
        <div className="mt-8 border rounded-lg bg-white shadow">

          <div className="p-4 border-b font-semibold">
            Matched Subscribers ({matched.length})
          </div>

          <div className="max-h-96 overflow-y-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                </tr>
              </thead>

              <tbody>

                {matched.map((subscriber) => (

                  <tr
                    key={subscriber.id}
                    className="border-t"
                  >
                    <td className="p-2">
                      {subscriber.name || "-"}
                    </td>

                    <td className="p-2">
                      {subscriber.email}
                    </td>
                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

      <div className="mt-10 border rounded-lg p-6 bg-yellow-50">

        <h2 className="font-bold text-lg mb-2">
          Ready to Recover
        </h2>

        <p className="mb-4">
          {summary.matchedSubscribers} subscribers are ready to resend.
        </p>

<button
  onClick={sendRecovery}
  disabled={sending}
  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded font-semibold"
>
  {sending
    ? "Sending..."
    : "Send Recovery Emails"}
</button>

      </div>

    </main>
  );
}