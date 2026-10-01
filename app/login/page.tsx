"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabaseBrowser.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo:
              `${window.location.origin}/auth/callback`,
          },
        });

      if (error) {
        alert(error.message);
        return;
      }

      setEmail(cleanEmail);
      setSent(true);
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      alert(
        "Unable to send the secure login link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">

      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* CODEXUS HEADER */}

        <div className="bg-slate-950 p-10 text-center text-white">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">

            <span className="text-4xl font-bold">
              C
            </span>

          </div>

          <h1 className="mt-6 text-4xl font-bold">
            Codexus Newsletter
          </h1>

          <p className="mt-3 text-lg text-slate-300">
            Communications Platform
          </p>

        </div>

        {/* BODY */}

        <div className="p-10">

          {!sent ? (
            <>

              <h2 className="text-2xl font-bold text-slate-900">
                Secure Login
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Enter your email address and we'll send you a
                secure login link. No password is required.
              </p>

              <label
                htmlFor="email"
                className="mt-8 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.co.nz"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !loading
                  ) {
                    sendMagicLink();
                  }
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 p-4 text-lg outline-none focus:border-slate-900"
              />

              <button
                type="button"
                onClick={sendMagicLink}
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-slate-950 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Sending..."
                  : "Send Secure Login Link"}
              </button>

              <p className="mt-6 text-center text-sm text-slate-400">
                Your access is determined by the organisation
                associated with your account.
              </p>

            </>
          ) : (
            <div className="rounded-xl bg-green-50 p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                ✓
              </div>

              <h2 className="mt-5 text-2xl font-bold text-green-700">
                Check Your Inbox
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                We've emailed a secure login link to:
              </p>

              <p className="mt-3 break-all text-xl font-semibold text-slate-900">
                {email}
              </p>

              <p className="mt-6 text-sm text-slate-500">
                Open the link in the email to securely access
                your organisation's newsletter portal.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="mt-6 text-sm font-semibold text-slate-700 underline"
              >
                Use another email address
              </button>

            </div>
          )}

        </div>

      </div>

    </main>
  );
}