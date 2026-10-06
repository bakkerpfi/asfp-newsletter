"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type InviteAcceptanceProps = {
  invitation: any;
  expired: boolean;
  signedInEmail: string | null;
};

export default function InviteAcceptance({
  invitation: i,
  expired,
  signedInEmail,
}: InviteAcceptanceProps) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const inviteEmail = i.contact_email.trim().toLowerCase();
  const currentEmail = (signedInEmail ?? "").trim().toLowerCase();

  const mismatch =
    Boolean(currentEmail) &&
    currentEmail !== inviteEmail;

  const unusable =
    expired ||
    i.status !== "pending" ||
    !i.companies;

  async function signOut() {
    setBusy(true);
    setMsg("");

    try {
      const next = `/invite/${i.token}`;

      const response = await fetch("/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          next,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to sign out."
        );
      }

      window.location.href =
        typeof data.next === "string"
          ? data.next
          : next;
    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again."
      );

      setBusy(false);
    }
  }

  async function magic() {
    setBusy(true);
    setMsg("");

    try {
      const next = `/invite/${i.token}`;

      const { error } =
        await supabaseBrowser.auth.signInWithOtp({
          email: inviteEmail,
          options: {
            emailRedirectTo:
              `${window.location.origin}` +
              `/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });

      if (error) {
        throw error;
      }

      setSent(true);
    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : "Unable to send secure sign-in link."
      );
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    setBusy(true);
    setMsg("");

    try {
      const response = await fetch(
        "/api/invitations/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: i.token,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to accept invitation."
        );
      }

      window.location.href =
        `/admin?company=${encodeURIComponent(
          data.company.slug
        )}`;
    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : "Unable to accept invitation."
      );

      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* CODEXUS HEADER */}

        <div className="bg-slate-950 p-10 text-center text-white">
          <img
            src="/Codexus-logo.png"
            alt="Codexus"
            className="mx-auto h-24 w-24 object-contain"
          />

          <h1 className="mt-5 text-3xl font-bold">
            Welcome to Codexus
          </h1>

          <p className="mt-2 text-slate-300">
            Workspace Invitation
          </p>
        </div>

        <div className="p-10">

          {msg && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              {msg}
            </div>
          )}

          <h2 className="text-2xl font-bold text-slate-900">
            You've been invited to{" "}
            {i.companies?.name}.
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Hi {i.contact_name}, you've been invited as
            an administrator of the{" "}
            <strong>{i.companies?.name}</strong>{" "}
            Codexus Newsletter workspace.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm">
            <div>
              <strong>Invited email:</strong>{" "}
              {i.contact_email}
            </div>

            <div className="mt-2">
              <strong>Access:</strong>{" "}
              Company Administrator
            </div>

            <div className="mt-2">
              <strong>Expires:</strong>{" "}
              {new Date(
                i.expires_at
              ).toLocaleString()}
            </div>
          </div>

          {expired && (
            <div className="mt-6 rounded-lg bg-amber-50 p-5 text-amber-900">
              This invitation has expired. Please ask
              the Codexus administrator for a new
              invitation.
            </div>
          )}

          {!expired &&
            i.status !== "pending" && (
              <div className="mt-6 rounded-lg bg-green-50 p-5 text-green-800">
                This invitation has already been{" "}
                {i.status}.
              </div>
            )}

          {!unusable && mismatch && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-900">
                Different account signed in
              </h3>

              <p className="mt-2 text-amber-900">
                You're currently signed in as{" "}
                <strong>{signedInEmail}</strong>, but
                this invitation belongs to{" "}
                <strong>{i.contact_email}</strong>.
              </p>

              <button
                type="button"
                onClick={signOut}
                disabled={busy}
                className="mt-4 rounded-lg bg-amber-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy
                  ? "Signing Out..."
                  : `Sign out and continue as ${i.contact_name}`}
              </button>
            </div>
          )}

          {!unusable &&
            !mismatch &&
            !signedInEmail &&
            !sent && (
              <>
                <p className="mt-7 leading-7 text-slate-600">
                  To securely activate your access,
                  we'll send a sign-in link to{" "}
                  <strong>{i.contact_email}</strong>.
                  No password is required.
                </p>

                <button
                  type="button"
                  onClick={magic}
                  disabled={busy}
                  className="mt-5 w-full rounded-lg bg-slate-950 px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy
                    ? "Sending..."
                    : "Send Secure Sign-In Link"}
                </button>
              </>
            )}

          {sent && (
            <div className="mt-7 rounded-xl bg-green-50 p-6 text-center">
              <h3 className="text-xl font-bold text-green-800">
                Check Your Inbox
              </h3>

              <p className="mt-3 text-slate-600">
                We've sent a secure sign-in link to{" "}
                <strong>{i.contact_email}</strong>.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Open the link in that email to return
                here and activate your access to{" "}
                {i.companies?.name}.
              </p>
            </div>
          )}

          {!unusable &&
            !mismatch &&
            signedInEmail && (
              <div className="mt-7">

                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  Signed in as{" "}
                  <strong>{signedInEmail}</strong>.
                  This matches the invitation.
                </div>

                <button
                  type="button"
                  onClick={accept}
                  disabled={busy}
                  className="mt-5 w-full rounded-lg bg-green-700 px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy
                    ? "Activating Access..."
                    : "Accept Invitation & Open Workspace"}
                </button>

              </div>
            )}
        </div>
      </div>
    </main>
  );
}