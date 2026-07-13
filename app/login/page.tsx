"use client";

import { useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

async function sendMagicLink() {
  if (!email) {
    alert("Please enter your email address.");
    return;
  }

  setLoading(true);

  const { error } = await supabaseBrowser.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  setLoading(false);

  if (error) {
    alert(error.message);
    return;
  }

  setSent(true);
}

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">

        {/* Header */}

        <div className="bg-[#1E2D5A] p-10 text-center text-white">

          <Image
            src="/AustraliaNewZealand-02.png"
            alt="ASFP"
            width={120}
            height={120}
            className="mx-auto h-auto"
            priority
          />

          <h1 className="mt-6 text-4xl font-bold">
            Member Portal
          </h1>

          <p className="mt-3 text-lg text-slate-200">
            Australia & New Zealand Branch
          </p>

        </div>

        {/* Body */}

        <div className="p-10">

          {!sent ? (
            <>

              <h2 className="text-2xl font-bold text-[#1E2D5A]">
                Secure Login
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Enter your email address and we'll send you a secure login
                link. No password is required.
              </p>

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-8 w-full rounded border p-4 text-lg"
              />

              <button
                onClick={sendMagicLink}
                disabled={loading}
                className="mt-6 w-full rounded bg-[#1E2D5A] px-6 py-4 text-lg font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
              >
                {loading
                  ? "Sending..."
                  : "Send Secure Login Link"}
              </button>

            </>
          ) : (
            <>

              <div className="rounded-lg bg-green-50 p-8 text-center">

                <h2 className="text-2xl font-bold text-green-700">
                  Check Your Inbox
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  We've emailed a secure login link to:
                </p>

                <p className="mt-3 text-xl font-semibold">
                  {email}
                </p>

                <p className="mt-6 text-sm text-slate-500">
                  The link will expire automatically for your security.
                </p>

              </div>

            </>
          )}

        </div>

      </div>

    </main>
  );
}