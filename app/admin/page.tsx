import AdminSidebar from "@/components/AdminSidebar";
import { initializeDatabase } from "@/lib/init-db";
import db from "@/lib/database";
import Link from "next/link";

export default function AdminPage() {
  initializeDatabase();

  const subscriberCount = db
    .prepare("SELECT COUNT(*) AS count FROM subscribers")
    .get() as { count: number };

  const issueCount = db
    .prepare("SELECT COUNT(*) AS count FROM issues")
    .get() as { count: number };

  const pollCount = db
    .prepare("SELECT COUNT(*) AS count FROM polls")
    .get() as { count: number };

  const articleCount = db
    .prepare("SELECT COUNT(*) AS count FROM articles")
    .get() as { count: number };

  const latestIssue = db.prepare(`
    SELECT *
    FROM issues
    ORDER BY id DESC
    LIMIT 1
  `).get() as any;

  const recentArticles = db.prepare(`
    SELECT *
    FROM articles
    ORDER BY id DESC
    LIMIT 5
  `).all() as any[];
  

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
              {subscriberCount.count}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-[#1E2D5A]">
              Newsletter Issues
            </h2>

            <p className="mt-3 text-4xl font-bold text-[#F52B3A]">
              {issueCount.count}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-[#1E2D5A]">
              Articles
            </h2>

            <p className="mt-3 text-4xl font-bold text-[#F52B3A]">
              {articleCount.count}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-[#1E2D5A]">
              Polls
            </h2>

            <p className="mt-3 text-4xl font-bold text-[#F52B3A]">
              {pollCount.count}
            </p>
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
      New Issue
    </Link>

    <Link
      href="/admin/articles"
      className="rounded bg-[#F52B3A] px-6 py-3 text-white hover:bg-red-600"
    >
      Add Article
    </Link>

    <Link
      href="/admin/polls"
      className="rounded bg-slate-700 px-6 py-3 text-white hover:bg-slate-800"
    >
      Create Poll
    </Link>

    <Link
      href="/admin/subscribers"
      className="rounded bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
    >
      Subscribers
    </Link>

    {latestIssue && (
      <Link
        href={`/newsletter/${latestIssue.id}`}
        className="rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
      >
        Preview Issue
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