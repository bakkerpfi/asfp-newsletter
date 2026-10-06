"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] =
    useState(false);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      const response = await fetch(
        "/auth/signout",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            next: "/login",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to sign out."
        );
      }

      const result = await response.json();

      router.replace(
        result.next || "/login"
      );

      router.refresh();
    } catch {
      alert(
        "Sign out failed. Please try again."
      );

      setSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="w-full rounded-lg border border-white/15 px-4 py-3 text-left font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {signingOut
        ? "Signing out..."
        : "Sign out"}
    </button>
  );
}