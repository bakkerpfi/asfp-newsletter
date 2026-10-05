import AdminSidebar from "@/components/AdminSidebar";
import SubscriberSearch from "@/components/SubscriberSearch";
import SendNewsletterButtons from "@/components/SendNewsletterButtons";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000";

type Props = { searchParams: Promise<{ company?: string }> };

type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
};

export default async function EmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,platform_admin")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("company_users")
    .select("company_id,role")
    .eq("user_id", user.id);

  const companyIds = memberships?.map((m) => m.company_id) ?? [];
  let companies: Company[] = [];

  if (companyIds.length > 0) {
    const { data } = await supabase
      .from("companies")
      .select("id,name,slug,logo_url,primary_colour,secondary_colour")
      .in("id", companyIds)
      .eq("active", true)
      .order("name", { ascending: true });
    companies = (data ?? []) as Company[];
  }

  if (companies.length === 0) {
    return <main className="p-10">No Company Access</main>;
  }

  const currentCompany =
    (params.company
      ? companies.find((c) => c.slug === params.company)
      : null) ?? companies[0];

  const [issueResult, countResult, subscribersResult] = await Promise.all([
    supabase.from("issues").select("*")
      .eq("company_id", currentCompany.id)
      .order("id", { ascending: false })
      .limit(1).maybeSingle(),
    supabase.from("subscribers").select("*", { count: "exact", head: true })
      .eq("company_id", currentCompany.id).eq("active", true),
    supabase.from("subscribers").select("*")
      .eq("company_id", currentCompany.id).eq("active", true)
      .order("name", { ascending: true }).limit(100),
  ]);

  const issue = issueResult.data;
  const subscriberCount = countResult.count ?? 0;
  const subscribers = subscribersResult.data ?? [];

  return (
    <div className="flex">
      <AdminSidebar
        companies={companies}
        currentCompany={currentCompany}
        platformAdmin={profile?.platform_admin ?? false}
      />

      <main className="flex-1 bg-slate-100 p-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Newsletter Campaign
        </h1>
        <p className="mt-2 text-slate-600">
          Prepare and send newsletters for <strong>{currentCompany.name}</strong>.
        </p>

        {!issue ? (
          <div className="mt-8 rounded-xl bg-white p-8 shadow">
            No newsletter issue has been created for {currentCompany.name}.
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-xl bg-white p-8 shadow">
              <h2 className="text-2xl font-bold">{issue.title}</h2>
              <p className="mt-2 text-slate-600">Issue {issue.issue_number}</p>
              <p className="text-slate-600">{issue.month} {issue.year}</p>
              <p className="mt-6 text-lg font-semibold text-slate-900">
                Active Subscribers: {subscriberCount}
              </p>
              <div className="mt-6 rounded border bg-slate-50 p-6">
                <strong>Email Subject</strong>
                <div className="mt-3 rounded border bg-white p-3">
                  {currentCompany.name} Newsletter – Issue {issue.issue_number}
                </div>
              </div>
            </div>

            <SubscriberSearch
              subscribers={subscribers}
              issueId={issue.id}
              websiteUrl={WEBSITE_URL}
            />

            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-8">
              <h2 className="text-2xl font-bold text-green-800">Send Newsletter</h2>
              <p className="mt-3 text-slate-700">
                Preview the audience before sending. The server independently verifies the issue and company.
              </p>
              <div className="mt-6">
<SendNewsletterButtons
  companySlug={currentCompany.slug}
  companyName={currentCompany.name}
  issueId={issue.id}
  issueNumber={issue.issue_number ?? issue.id}
/>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
