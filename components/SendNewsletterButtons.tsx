"use client";

import { useState } from "react";

type Props = {
  companySlug: string;
  companyName: string;
  issueId: number;
};

type Preview = {
  audience: {
    active: number;
    alreadySent: number;
    pending: number;
  };
  recipients: Array<{
    id: number;
    name: string | null;
    email: string;
  }>;
};

export default function SendNewsletterButtons({
  companySlug,
  companyName,
  issueId,
}: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [proofEmail, setProofEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [sendingProof, setSendingProof] = useState(false);
  const [sending, setSending] = useState(false);

  async function previewAudience() {
    try {
      setChecking(true);

      const res = await fetch("/api/send-newsletter/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companySlug, issueId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Unable to preview campaign.");
        return;
      }

      setPreview(data);
    } finally {
      setChecking(false);
    }
  }

  async function sendProof() {
    if (!proofEmail.trim()) {
      alert("Enter an existing subscriber email for this company.");
      return;
    }

    try {
      setSendingProof(true);

      const res = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySlug,
          issueId,
          email: proofEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Proof email failed.");
        return;
      }

      alert(
        `Proof email sent successfully.\n\n` +
        `Company: ${data.company.name}\n` +
        `Issue: ${data.issue.number}\n` +
        `Recipient: ${data.subscriber.email}`
      );
    } finally {
      setSendingProof(false);
    }
  }

  async function sendNewsletter() {
    if (!preview) return;

    const ok = confirm(
      `Send this newsletter for ${companyName}?\n\n` +
      `Active: ${preview.audience.active}\n` +
      `Already sent: ${preview.audience.alreadySent}\n` +
      `Pending: ${preview.audience.pending}\n\n` +
      `This action cannot be undone.`
    );

    if (!ok) return;

    try {
      setSending(true);

      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companySlug, issueId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Newsletter send failed.");
        return;
      }

      alert(
        `Campaign complete.\n\n` +
        `Total: ${data.total}\n` +
        `Sent: ${data.sent}\n` +
        `Skipped: ${data.skipped}\n` +
        `Failed: ${data.failedCount}\n` +
        `Remaining: ${data.remaining}`
      );

      await previewAudience();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-5">
        <h3 className="font-bold">Send Proof Email</h3>

        <p className="mt-1 text-sm text-slate-500">
          Enter an existing subscriber email belonging to {companyName}.
          The server rejects subscribers from another company.
        </p>

        <div className="mt-4 flex max-w-2xl flex-wrap gap-3">
          <input
            type="email"
            value={proofEmail}
            onChange={(event) => setProofEmail(event.target.value)}
            placeholder="subscriber@example.com"
            className="min-w-72 flex-1 rounded border p-3"
          />

          <button
            type="button"
            onClick={sendProof}
            disabled={sendingProof}
            className="rounded bg-slate-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {sendingProof ? "Sending Proof..." : "Send Proof Email"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={previewAudience}
          disabled={checking || sending}
          className="rounded bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {checking ? "Checking..." : "Preview Campaign Audience"}
        </button>

        <button
          type="button"
          onClick={sendNewsletter}
          disabled={!preview || sending || preview.audience.pending === 0}
          className="rounded bg-green-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? "Sending..." : "Send Newsletter"}
        </button>
      </div>

      {preview && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <h3 className="font-bold text-blue-900">Campaign Audience Preview</h3>

          <p className="mt-3">
            Active: <strong>{preview.audience.active}</strong> ·
            Already sent: <strong>{preview.audience.alreadySent}</strong> ·
            Pending: <strong>{preview.audience.pending}</strong>
          </p>

          <div className="mt-4 max-h-56 overflow-y-auto rounded border bg-white">
            {preview.recipients.map((recipient) => (
              <div
                key={recipient.id}
                className="border-b px-4 py-3 text-sm last:border-b-0"
              >
                <strong>{recipient.name || "Unnamed subscriber"}</strong>
                <span className="ml-2 text-slate-500">{recipient.email}</span>
              </div>
            ))}

            {preview.recipients.length === 0 && (
              <div className="p-4 text-sm text-slate-500">
                No pending recipients.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Resume and recovery remain temporarily disabled until those routes are converted to the same tenant-safe model.
      </div>
    </div>
  );
}
