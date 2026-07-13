"use client";

import { useState } from "react";

export default function UnsubscribeButton({
  token,
}: {
  token: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "already" | "error"
  >("idle");

  const [errorMessage, setErrorMessage] = useState("");

  async function unsubscribe() {
    if (
      !confirm(
        "Are you sure you want to unsubscribe from future ASFP newsletters?"
      )
    ) {
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/subscribers/unsubscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.error ?? "Unable to unsubscribe."
        );
        setStatus("error");
        return;
      }

      if (result.alreadyUnsubscribed) {
        setStatus("already");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage(
        "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg bg-green-50 p-5 text-green-800">
        You have successfully unsubscribed from future ASFP
        newsletters.
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="rounded-lg bg-slate-100 p-5 text-slate-700">
        This email address has already been unsubscribed.
      </div>
    );
  }

  return (
    <div>
      {status === "error" && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={unsubscribe}
        disabled={status === "loading"}
        className="rounded bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? "Unsubscribing..."
          : "Unsubscribe Me"}
      </button>
    </div>
  );
}