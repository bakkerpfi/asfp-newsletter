import AdminSidebar from "@/components/AdminSidebar";
import SubscriberSearch from "@/components/SubscriberSearch";
import SendNewsletterButtons from "@/components/SendNewsletterButtons";
import { supabase } from "@/lib/supabase";

const WEBSITE_URL = "https://asfp-newsletter.vercel.app";

export default async function EmailPage() {
  const { data: latestIssue } = await supabase
    .from("issues")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single();

// Get the exact number of active subscribers
const { count: subscriberCount } = await supabase
  .from("subscribers")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("active", true);

// Load ALL active subscribers (handles more than 1000)
let subscribers: any[] = [];

const pageSize = 1000;

for (
  let from = 0;
  from < (subscriberCount ?? 0);
  from += pageSize
) {
  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true })
    .range(from, from + pageSize - 1);

  subscribers.push(...(data ?? []));
}

  const emailSubject = latestIssue
    ? `ASFP ANZ Industry Update – Issue ${latestIssue.issue_number}`
    : "";

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Email Campaign
        </h1>

        {!latestIssue ? (
          <div className="mt-8 rounded-xl bg-white p-8 shadow">
            <p className="text-slate-500">
              No newsletter issue has been created.
            </p>
          </div>
        ) : (
          <>

            {/* Newsletter */}

            <div className="mt-8 rounded-xl bg-white p-8 shadow">

              <h2 className="text-2xl font-bold">
                {latestIssue.title}
              </h2>

              <p className="mt-2 text-slate-600">
                Issue {latestIssue.issue_number}
              </p>

              <p className="text-slate-600">
                {latestIssue.month} {latestIssue.year}
              </p>

              <p className="mt-6 text-lg font-semibold text-[#1E2D5A]">
                Active Subscribers: {subscriberCount}
              </p>

              <div className="mt-6 rounded border bg-slate-50 p-6">

                <strong>Email Subject</strong>

                <textarea
                  readOnly
                  rows={2}
                  className="mt-3 w-full rounded border p-3"
                  value={emailSubject}
                />

              </div>

            </div>

            {/* Subscriber Search */}

            <SubscriberSearch
              subscribers={subscribers}
              issueId={latestIssue.id}
              websiteUrl={WEBSITE_URL}
            />

            {/* Campaign Status */}

            <div className="mt-8 rounded-xl bg-white p-8 shadow">

              <h2 className="text-2xl font-bold text-[#1E2D5A]">
                Campaign Status
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-3">

                <div>
                  <p className="text-sm text-slate-500">
                    Status
                  </p>

                  <p className="text-xl font-semibold text-orange-600">
                    Draft
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Active Subscribers
                  </p>

                  <p className="text-xl font-semibold">
                    {subscriberCount}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Current Issue
                  </p>

                  <p className="text-xl font-semibold">
                    #{latestIssue.issue_number}
                  </p>
                </div>

              </div>

            </div>

            {/* Send Campaign */}

            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-8">

              <h2 className="text-2xl font-bold text-green-800">
                Send Campaign
              </h2>

              <p className="mt-3 text-slate-700">
                Send this newsletter to all active subscribers using
                personalised newsletter links.
              </p>

              <div className="mt-6">
                <SendNewsletterButtons />
              </div>

              <div className="mt-6 rounded-lg bg-white p-4 text-sm text-slate-600">

                <p>✓ Personalised newsletter links</p>
                <p>✓ One-click unsubscribe</p>
                <p>✓ Individual subscriber tracking</p>

              </div>

            </div>

          </>
        )}

      </main>

    </div>
  );
}