import AdminSidebar from "@/components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminPage() {

const PREVIEW_EMAIL = "Paul.Ryan@asfp.co.nz";

const { count: subscriberCount } = await supabase
  .from("subscribers")
  .select("*", {
    count: "exact",
    head: true,
  });

const { data: issues } = await supabase
  .from("issues")
  .select("*")
  .order("id", { ascending: false });

const { data: articles } = await supabase
  .from("articles")
  .select("*")
  .order("id", { ascending: false });

const { data: polls } = await supabase
  .from("polls")
  .select("*");

const issueCount = issues?.length ?? 0;
const articleCount = articles?.length ?? 0;
const pollCount = polls?.length ?? 0;

const latestIssue = issues?.[0] ?? null;
console.log("LATEST ISSUE:", latestIssue);
const recentArticles = articles?.slice(0, 5) ?? [];
const { data: paul } = await supabase
  .from("subscribers")
  .select("unsubscribe_token")
  .ilike("email", PREVIEW_EMAIL)
  .single();

  console.log("PAUL:", paul);
  

  return (
    <div className="flex">

      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Welcome to the ASFP Newsletter Portal.
        </p>

        {/* STATISTICS */}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-[#1E2D5A]">
              Subscribers
            </h2>

            <p className="mt-3 text-4xl font-bold text-[#F52B3A]">
              {subscriberCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-[#1E2D5A]">
              Newsletter Issues
            </h2>

            <p className="mt-3 text-4xl font-bold text-[#F52B3A]">
              {issueCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-[#1E2D5A]">
              Articles
            </h2>

            <p className="mt-3 text-4xl font-bold text-[#F52B3A]">
              {articleCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-[#1E2D5A]">
              Polls
            </h2>

            <p className="mt-3 text-4xl font-bold text-[#F52B3A]">
              {pollCount}
            </p>
          </div>

        </div>

{/* CAMPAIGN STATUS */}

<div className="mt-8 rounded-xl bg-white p-8 shadow">

  <h2 className="text-3xl font-bold text-[#1E2D5A]">
    Campaign Status
  </h2>

  <div className="mt-8 grid gap-8 md:grid-cols-4">

    <div>
      <p className="text-slate-500">
        Status
      </p>

      <p className="text-3xl font-bold text-orange-600">
        Draft
      </p>
    </div>

    <div>
      <p className="text-slate-500">
        Active Subscribers
      </p>

      <p className="text-3xl font-bold">
        {subscriberCount ?? 0}
      </p>
    </div>

    <div>
      <p className="text-slate-500">
        Current Issue
      </p>

      <p className="text-3xl font-bold">
        #{latestIssue?.issue_number}
      </p>
    </div>

    <div>
      <p className="text-slate-500">
        Last Campaign
      </p>

      <p className="text-3xl font-bold text-slate-700">
        Never Sent
      </p>
    </div>

  </div>

</div>


{/* QUICK ACTIONS */}

<div className="mt-8 rounded-xl bg-white p-8 shadow">

  <h2 className="mb-6 text-2xl font-bold text-[#1E2D5A]">
    Quick Actions
  </h2>

  <div className="flex flex-wrap gap-4">

    <Link
      href="/admin/issues"
      className="rounded bg-[#1E2D5A] px-6 py-3 text-white hover:bg-blue-900"
    >
      New / Edit Issue
    </Link>

    <Link
      href="/admin/articles"
      className="rounded bg-[#F52B3A] px-6 py-3 text-white hover:bg-red-600"
    >
      Add / Edit Articles
    </Link>

    <Link
      href="/admin/polls"
      className="rounded bg-slate-700 px-6 py-3 text-white hover:bg-slate-800"
    >
      Create / Edit Polls
    </Link>

    <Link
      href="/admin/subscribers"
      className="rounded bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
    >
      Add / View Subscribers
    </Link>

{latestIssue && paul && (
  <Link
    href={`https://asfp-newsletter.vercel.app/newsletter/${latestIssue.id}?u=${paul.unsubscribe_token}`}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
  >
    Preview Newsletter
  </Link>
)}

    <Link
      href="/admin/email"
      className="rounded bg-orange-600 px-6 py-3 text-white hover:bg-orange-700"
    >
      Email Campaign
    </Link>

  </div>

</div>

{/* CURRENT ISSUE & RECENT ARTICLES */}

<div className="mt-8 grid gap-6 lg:grid-cols-2">

  <div className="rounded-xl bg-white p-8 shadow">

    <h2 className="mb-6 text-2xl font-bold text-[#1E2D5A]">
      Current Issue
    </h2>

    {latestIssue ? (

      <Link
        href={`/newsletter/${latestIssue.id}`}
        className="block rounded-lg border p-6 transition hover:bg-slate-50"
      >

        <p className="text-2xl font-semibold">
          {latestIssue.title}
        </p>

        <p className="mt-2 text-slate-600">
          Issue {latestIssue.issue_number}
        </p>

        <p className="text-slate-600">
          {latestIssue.month} {latestIssue.year}
        </p>

        <p className="mt-4 text-sm text-green-600">
          Click to preview newsletter →
        </p>

      </Link>

    ) : (
      <p className="text-slate-500">
        No newsletter issue created.
      </p>
    )}

  </div>

  <div className="rounded-xl bg-white p-8 shadow">

    <h2 className="mb-6 text-2xl font-bold text-[#1E2D5A]">
      Recent Articles
    </h2>

    {recentArticles.length === 0 && (
      <p className="text-slate-500">
        No articles created yet.
      </p>
    )}

    {recentArticles.map((article) => (
      <div
        key={article.id}
        className="mb-4 border-b pb-4 last:border-b-0"
      >
        <p className="font-semibold">
          {article.title}
        </p>

        <p className="text-sm text-slate-500">
          {article.author}
        </p>

        <p className="text-sm text-red-500">
          {article.category}
        </p>
      </div>
    ))}

  </div>

</div>

      </main>

    </div>
  );
}