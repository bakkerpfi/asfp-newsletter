import AdminSidebar from "@/components/AdminSidebar";
import SubscriberSearch from "@/components/SubscriberSearch";
import SendNewsletterButtons from "@/components/SendNewsletterButtons";
import CampaignDashboard from "@/components/CampaignDashboard";
import { supabase } from "@/lib/supabase";

const WEBSITE_URL = "https://asfp-newsletter.vercel.app";

export default async function EmailPage() {
  const [
    latestIssueResult,
    subscriberCountResult,
    subscribersResult,
  ] = await Promise.all([
    supabase
      .from("issues")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    // Only load the first 100 subscribers initially
    supabase
      .from("subscribers")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true })
      .limit(100),
  ]);

  const latestIssue = latestIssueResult.data;
  const subscriberCount =
    subscriberCountResult.count ?? 0;

  const subscribers =
    subscribersResult.data ?? [];

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

            <CampaignDashboard />

            <SubscriberSearch
              subscribers={subscribers}
              issueId={latestIssue.id}
              websiteUrl={WEBSITE_URL}
            />

            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-8">

              <h2 className="text-2xl font-bold text-green-800">
                Send Campaign
              </h2>

              <p className="mt-3 text-slate-700">
                Send this newsletter to all active subscribers using personalised newsletter links.
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