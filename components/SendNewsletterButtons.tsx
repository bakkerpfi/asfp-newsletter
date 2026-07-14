"use client";

import { useState } from "react";

export default function SendNewsletterButtons() {
  const [proofEmail, setProofEmail] = useState("");

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
      `Newsletter complete!\n\nSent: ${data.sent}\nFailed: ${data.failed.length}`
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

      </div>

    </div>
  );
}