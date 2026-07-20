"use client";

import { useState } from "react";

export default function SendNewsletterButtons() {
  const [proofEmail, setProofEmail] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);

  async function resumeCampaign() {

  if (
    !confirm(
      "Resume this newsletter campaign?\n\nOnly subscribers who have NOT already received this issue will be emailed."
    )
  ) {
    return;
  }

  const response = await fetch(
    "/api/resume-newsletter",
    {
      method: "POST",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    alert(data.error ?? "Resume failed.");
    return;
  }

alert(
  `Campaign resumed.\n\n` +
  `Sent: ${data.sent}\n` +
  `Skipped: ${data.skipped}`
);

window.dispatchEvent(
  new Event("campaign-status-updated")
);

}

  async function sendRecovery() {

  const ok = confirm(
`You are about to resend ONLY the subscribers identified by Campaign Recovery.

Subscribers who have already been recovered will NOT receive another email.

Do you want to continue?`
  );

  if (!ok) return;

  try {

    setSendingRecovery(true);

    const res = await fetch(
      "/api/campaign-recovery/send",
      {
        method: "POST",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Recovery failed.");
      return;
    }

alert(
  `Recovery Complete!\n\n` +
  `Recovered: ${data.found}\n` +
  `Sent: ${data.sent}\n` +
  `Remaining: ${data.remaining}`
);

window.dispatchEvent(
  new Event("campaign-status-updated")
);

  } finally {

    setSendingRecovery(false);

  }
}

  async function sendTest() {
    const res = await fetch("/api/send-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: proofEmail,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to send.");
      return;
    }

    alert("✅ Proof email sent successfully!");
  }

  async function sendNewsletter() {
const ok = confirm(
`You are about to email the newsletter to ALL active subscribers.

Every subscriber will receive:
• Their own personalised newsletter link
• Their own unsubscribe link

This action cannot be undone.

Do you want to continue?`
);

if (!ok) return;

    const res = await fetch("/api/send-newsletter", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

alert(
  `Newsletter complete!\n\n` +
  `Total: ${data.total}\n` +
  `Sent: ${data.sent}\n` +
  `Failed: ${data.failedCount}`
);

window.dispatchEvent(
  new Event("campaign-status-updated")
);
  }

  return (
    <div className="space-y-6">

      <div>

        <label className="mb-2 block font-semibold">
          Proof Email Recipient
        </label>

        <input
          type="email"
          value={proofEmail}
          onChange={(e) => setProofEmail(e.target.value)}
          placeholder="paul@example.com"
          className="w-full max-w-md rounded border p-3"
        />

      </div>

      <div className="flex flex-wrap gap-4">

        <button
          onClick={sendTest}
          className="rounded bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
        >
          Send Proof Email
        </button>

        <button
          onClick={sendNewsletter}
          className="rounded bg-[#1E2D5A] px-6 py-3 font-semibold text-white hover:bg-blue-900"
        >
          Send Newsletter
        </button>

        <button
  onClick={resumeCampaign}
  className="rounded bg-orange-600 px-6 py-3 text-white hover:bg-orange-700"
>
  Resume Campaign
</button>

<button
  onClick={sendRecovery}
  disabled={sendingRecovery}
  className="rounded bg-purple-700 px-6 py-3 text-white hover:bg-purple-800 disabled:bg-gray-400"
>
  {sendingRecovery
    ? "Recovering..."
    : "Recovery Emails"}
</button>

      </div>

    </div>
  );
}