import AdminSidebar from "@/components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{
    company?: string;
  }>;
};

type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
};

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const params = await searchParams;

  // =====================================================
  // AUTHENTICATED USER
  // =====================================================

  const userSupabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =====================================================
  // USER PROFILE
  // =====================================================

  const { data: profile } =
    await userSupabase
      .from("profiles")
      .select(
        "id,full_name,platform_admin"
      )
      .eq("id", user.id)
      .single();

  // =====================================================
  // COMPANY MEMBERSHIPS
  // =====================================================

  const { data: memberships } =
    await userSupabase
      .from("company_users")
      .select(
        "company_id,role"
      )
      .eq("user_id", user.id);

  const companyIds =
    memberships?.map(
      (membership) =>
        membership.company_id
    ) ?? [];

  // =====================================================
  // AUTHORISED COMPANIES
  // =====================================================

  let companies: Company[] = [];

  if (companyIds.length > 0) {
    const { data: companyData } =
      await userSupabase
        .from("companies")
        .select(
          "id,name,slug,logo_url,primary_colour,secondary_colour"
        )
        .in("id", companyIds)
        .eq("active", true)
        .order("name", {
          ascending: true,
        });

    companies =
      (companyData ?? []) as Company[];
  }

  // =====================================================
  // NO COMPANY ACCESS
  // =====================================================

  if (companies.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-8">

        <div className="max-w-lg rounded-xl bg-white p-10 text-center shadow">

          <h1 className="text-2xl font-bold text-slate-900">
            No Company Access
          </h1>

          <p className="mt-4 text-slate-600">
            Your account is valid, but it has not yet been
            assigned to an organisation.
          </p>

        </div>

      </main>
    );
  }

  // =====================================================
  // CURRENT COMPANY
  // =====================================================

  const requestedCompany =
    params.company
      ? companies.find(
          (company) =>
            company.slug ===
            params.company
        )
      : null;

  const currentCompany =
    requestedCompany ??
    companies[0];

  const companyId =
    currentCompany.id;

  const companyQuery =
    `?company=${encodeURIComponent(
      currentCompany.slug
    )}`;

  // =====================================================
  // COMPANY BRANDING
  // =====================================================

  const primaryColour =
    currentCompany.primary_colour ||
    "#0F172A";

  const secondaryColour =
    currentCompany.secondary_colour ||
    "#DC2626";

  // =====================================================
  // TENANT-SCOPED SUBSCRIBERS
  // =====================================================

  const {
    count: subscriberCount,
  } = await supabase
    .from("subscribers")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "company_id",
      companyId
    );

  const {
    count: activeSubscriberCount,
  } = await supabase
    .from("subscribers")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "company_id",
      companyId
    )
    .eq(
      "active",
      true
    );

  const {
    count: unsubscribedCount,
  } = await supabase
    .from("subscribers")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "company_id",
      companyId
    )
    .eq(
      "active",
      false
    );

  // =====================================================
  // TENANT-SCOPED ISSUES
  // =====================================================

  const {
    data: issues,
  } = await supabase
    .from("issues")
    .select("*")
    .eq(
      "company_id",
      companyId
    )
    .order(
      "id",
      {
        ascending: false,
      }
    );

  // =====================================================
  // TENANT-SCOPED ARTICLES
  // =====================================================

  const {
    data: articles,
  } = await supabase
    .from("articles")
    .select("*")
    .eq(
      "company_id",
      companyId
    )
    .order(
      "id",
      {
        ascending: false,
      }
    );

  // =====================================================
  // TENANT-SCOPED POLLS
  // =====================================================

  const {
    data: polls,
  } = await supabase
    .from("polls")
    .select("*")
    .eq(
      "company_id",
      companyId
    );

  // =====================================================
  // COUNTS
  // =====================================================

  const issueCount =
    issues?.length ?? 0;

  const articleCount =
    articles?.length ?? 0;

  const pollCount =
    polls?.length ?? 0;

  const latestIssue =
    issues?.[0] ?? null;

  const recentArticles =
    articles?.slice(0, 5) ?? [];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="flex">

      <AdminSidebar
        companies={companies}
        currentCompany={currentCompany}
        platformAdmin={
          profile?.platform_admin ??
          false
        }
      />

      <main className="flex-1 bg-slate-100 p-10">

        {/* HEADER */}

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h1
              className="text-4xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Dashboard
            </h1>

            <p className="mt-2 text-lg font-semibold text-slate-700">
              {currentCompany.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Signed in as{" "}
              {profile?.full_name ??
                user.email}
            </p>

          </div>

          {profile?.platform_admin && (

            <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">

              <p className="font-semibold text-slate-800">
                Codexus Platform Admin
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {companies.length} companies available
              </p>

            </div>

          )}

        </div>

        {/* SUBSCRIBER STATISTICS */}

        <div className="mt-8 grid gap-6 md:grid-cols-3">

          {/* TOTAL */}

          <Link
            href={`/admin/subscribers${companyQuery}`}
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >

            <h2
              className="text-xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Total Subscribers
            </h2>

            <p
              className="mt-3 text-4xl font-bold"
              style={{
                color:
                  secondaryColour,
              }}
            >
              {subscriberCount ?? 0}
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              View all subscribers →
            </p>

          </Link>

          {/* ACTIVE */}

          <Link
            href={`/admin/subscribers${companyQuery}&status=active`}
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >

            <h2
              className="text-xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Active Subscribers
            </h2>

            <p className="mt-3 text-4xl font-bold text-green-600">
              {activeSubscriberCount ?? 0}
            </p>

            <p className="mt-2 text-sm font-semibold text-green-600">
              View active subscribers →
            </p>

          </Link>

          {/* UNSUBSCRIBED */}

          <Link
            href={`/admin/subscribers${companyQuery}&status=inactive`}
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >

            <h2
              className="text-xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Unsubscribed
            </h2>

            <p className="mt-3 text-4xl font-bold text-orange-600">
              {unsubscribedCount ?? 0}
            </p>

            <p className="mt-2 text-sm font-semibold text-orange-600">
              View unsubscribed →
            </p>

          </Link>

        </div>

        {/* CONTENT STATISTICS */}

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          {/* ISSUES */}

          <Link
            href={`/admin/issues${companyQuery}`}
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >

            <h2
              className="text-xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Newsletter Issues
            </h2>

            <p
              className="mt-3 text-4xl font-bold"
              style={{
                color:
                  secondaryColour,
              }}
            >
              {issueCount}
            </p>

          </Link>

          {/* ARTICLES */}

          <Link
            href={`/admin/articles${companyQuery}`}
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >

            <h2
              className="text-xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Articles
            </h2>

            <p
              className="mt-3 text-4xl font-bold"
              style={{
                color:
                  secondaryColour,
              }}
            >
              {articleCount}
            </p>

          </Link>

          {/* POLLS */}

          <Link
            href={`/admin/polls${companyQuery}`}
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >

            <h2
              className="text-xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Polls
            </h2>

            <p
              className="mt-3 text-4xl font-bold"
              style={{
                color:
                  secondaryColour,
              }}
            >
              {pollCount}
            </p>

          </Link>

        </div>

        {/* CAMPAIGN STATUS */}

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <h2
            className="text-3xl font-bold"
            style={{
              color:
                primaryColour,
            }}
          >
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
                {activeSubscriberCount ?? 0}
              </p>

            </div>

            <div>

              <p className="text-slate-500">
                Current Issue
              </p>

              <p className="text-3xl font-bold">
                {latestIssue
                  ? `#${latestIssue.issue_number}`
                  : "—"}
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

          <h2
            className="mb-6 text-2xl font-bold"
            style={{
              color:
                primaryColour,
            }}
          >
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-4">

            <Link
              href={`/admin/issues${companyQuery}`}
              className="rounded px-6 py-3 text-white"
              style={{
                backgroundColor:
                  primaryColour,
              }}
            >
              New / Edit Issue
            </Link>

            <Link
              href={`/admin/articles${companyQuery}`}
              className="rounded px-6 py-3 text-white"
              style={{
                backgroundColor:
                  secondaryColour,
              }}
            >
              Add / Edit Articles
            </Link>

            <Link
              href={`/admin/polls${companyQuery}`}
              className="rounded bg-slate-700 px-6 py-3 text-white hover:bg-slate-800"
            >
              Create / Edit Polls
            </Link>

            <Link
              href={`/admin/subscribers${companyQuery}`}
              className="rounded bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
            >
              Add / View Subscribers
            </Link>

            <Link
              href={`/admin/email${companyQuery}`}
              className="rounded bg-orange-600 px-6 py-3 text-white hover:bg-orange-700"
            >
              Newsletter Campaign
            </Link>

            <Link
              href={`/admin/email/create${companyQuery}`}
              className="rounded px-6 py-3 text-white"
              style={{
                backgroundColor:
                  secondaryColour,
              }}
            >
              Create Email
            </Link>

          </div>

        </div>

        {/* CURRENT ISSUE & RECENT ARTICLES */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* CURRENT ISSUE */}

          <div className="rounded-xl bg-white p-8 shadow">

            <h2
              className="mb-6 text-2xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
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
                  Issue{" "}
                  {latestIssue.issue_number}
                </p>

                <p className="text-slate-600">
                  {latestIssue.month}{" "}
                  {latestIssue.year}
                </p>

                <p className="mt-4 text-sm text-green-600">
                  Click to preview newsletter →
                </p>

              </Link>

            ) : (

              <p className="text-slate-500">
                No newsletter issue created for{" "}
                {currentCompany.name}.
              </p>

            )}

          </div>

          {/* RECENT ARTICLES */}

          <div className="rounded-xl bg-white p-8 shadow">

            <h2
              className="mb-6 text-2xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Recent Articles
            </h2>

            {recentArticles.length ===
              0 && (

              <p className="text-slate-500">
                No articles created yet for{" "}
                {currentCompany.name}.
              </p>

            )}

            {recentArticles.map(
              (article) => (

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

                  <p
                    className="text-sm"
                    style={{
                      color:
                        secondaryColour,
                    }}
                  >
                    {article.category}
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      </main>

    </div>
  );
}