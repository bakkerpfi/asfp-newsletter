"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  issue: {
    id: number;
    number: string;
    title: string;
  };

  campaign: {
    status: string;
    activeSubscribers: number;
    sent: number;
    remaining: number;
  };

  recovery: {
    matchedSubscribers: number;
    unmatchedEmails: number;
    csvLogIds: number;
    logsRetrieved: number;
  };
};

export default function CampaignDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    try {
      const res = await fetch("/api/email/status", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error);
      }

      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();

    const refresh = () => loadStatus();

    window.addEventListener(
      "campaign-status-updated",
      refresh
    );

    return () =>
      window.removeEventListener(
        "campaign-status-updated",
        refresh
      );
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        Loading campaign...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        Unable to load campaign.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow">

      <div className="mb-8 flex items-center justify-between">

        <div>
          <h2 className="text-3xl font-bold text-[#1E2D5A]">
            Campaign Dashboard
          </h2>

          <p className="mt-1 text-gray-500">
            Newsletter Campaign Overview
          </p>
        </div>

      </div>

      <div className="grid gap-5 md:grid-cols-4">

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Current Issue
          </p>

          <p className="mt-2 text-2xl font-bold text-[#1E2D5A]">
            #{data.issue.number}
          </p>

          <p className="mt-1 text-sm">
            {data.issue.title}
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Campaign Status
          </p>

          <p className="mt-2 text-2xl font-bold text-orange-600">
            {data.campaign.status}
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Active Subscribers
          </p>

          <p className="mt-2 text-4xl font-bold text-[#1E2D5A]">
            {data.campaign.activeSubscribers}
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Emails Sent
          </p>

          <p className="mt-2 text-4xl font-bold text-green-700">
            {data.campaign.sent}
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Remaining
          </p>

          <p className="mt-2 text-4xl font-bold text-red-600">
            {data.campaign.remaining}
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Recovery Matches
          </p>

          <p className="mt-2 text-4xl font-bold text-purple-700">
            {data.recovery.matchedSubscribers}
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Unmatched Emails
          </p>

          <p className="mt-2 text-4xl font-bold text-red-700">
            {data.recovery.unmatchedEmails}
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Recovery Log Entries
          </p>

          <p className="mt-2 text-4xl font-bold text-blue-700">
            {data.recovery.csvLogIds}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Logs Retrieved: {data.recovery.logsRetrieved}
          </p>
        </div>

      </div>

    </div>
  );
}