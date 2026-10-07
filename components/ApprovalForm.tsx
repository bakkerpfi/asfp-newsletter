"use client";

import { useState } from "react";

type Props = {
  token: string;
  campaign: any;
};

export default function ApprovalForm({
  token,
  campaign,
}: Props) {
  const [name, setName] =
    useState(
      campaign.approved_by_name ?? ""
    );

  const [busy, setBusy] =
    useState(false);

  const [approved, setApproved] =
    useState(
      Boolean(campaign.approved_at)
    );

  const [message, setMessage] =
    useState("");

  const company =
    Array.isArray(campaign.companies)
      ? campaign.companies[0]
      : campaign.companies;

  async function approve() {
    if (!name.trim()) {
      setMessage(
        "Please enter your name."
      );
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/announcement-proof/approve",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token,
            approverName:
              name.trim(),
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Unable to approve email."
        );
      }

      setApproved(true);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to approve email."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">

        <div className="bg-slate-950 p-8 text-center text-white">
          {company?.logo_url && (
            <img
              src={company.logo_url}
              alt={company.name}
              className="mx-auto mb-5 max-h-20 max-w-[220px] object-contain"
            />
          )}

          <h1 className="text-2xl font-bold">
            Email Proof Approval
          </h1>

          <p className="mt-2 text-slate-300">
            {company?.name}
          </p>
        </div>

        <div className="p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Email subject
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {campaign.subject}
          </h2>

          <p className="mt-5 leading-7 text-slate-600">
            Please confirm that you have reviewed the proof email you received and approve this exact version for distribution.
          </p>

          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            Proof sent to{" "}
            <strong>
              {campaign.proof_email}
            </strong>
          </div>

          {approved ? (
            <div className="mt-7 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <h3 className="text-xl font-bold text-green-800">
                ✓ Email Approved
              </h3>

              <p className="mt-3 text-slate-600">
                This email has been approved for distribution.
              </p>

              <p className="mt-3 text-sm text-slate-500">
                You can close this page. The Codexus administrator can now send the approved email.
              </p>
            </div>
          ) : (
            <>
              <label className="mt-7 block font-semibold text-slate-700">
                Your name
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="e.g. Paul Ryan"
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />

              {message && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={approve}
                disabled={busy}
                className="mt-6 w-full rounded-lg bg-green-700 px-6 py-4 text-lg font-bold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {busy
                  ? "Approving..."
                  : "Approve Email for Sending"}
              </button>

              <p className="mt-4 text-center text-xs text-slate-500">
                Only approve if the proof email is ready to be distributed.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}