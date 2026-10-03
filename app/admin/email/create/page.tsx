import AdminSidebar from "@/components/AdminSidebar";
import SendAnnouncement from "@/components/SendAnnouncement";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ company?: string }>;
};

type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
};

export default async function CreateEmailPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("id,platform_admin")
      .eq("id", user.id)
      .single();

  const { data: memberships } =
    await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id);

  let companyIds =
    memberships?.map(
      (membership) =>
        membership.company_id
    ) ?? [];

  if (profile?.platform_admin) {
    const { data: allCompanies } =
      await supabase
        .from("companies")
        .select("id")
        .eq("active", true);

    companyIds =
      allCompanies?.map(
        (company) =>
          company.id
      ) ?? [];
  }

  const { data: companyRows } =
    await supabase
      .from("companies")
      .select(
        "id,name,slug,logo_url,primary_colour,secondary_colour"
      )
      .in("id", companyIds)
      .eq("active", true)
      .order("name", {
        ascending: true,
      });

  const companies =
    (companyRows ?? []) as Company[];

  if (companies.length === 0) {
    return (
      <main className="p-10">
        No Company Access
      </main>
    );
  }

  const currentCompany =
    (params.company
      ? companies.find(
          (company) =>
            company.slug ===
            params.company
        )
      : null) ?? companies[0];

  const { count, error } =
    await supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "company_id",
        currentCompany.id
      )
      .eq("active", true);

  if (error) {
    console.error(
      "ACTIVE SUBSCRIBER COUNT ERROR:",
      error
    );
  }

  return (
    <div className="flex">
      <AdminSidebar
        companies={companies}
        currentCompany={
          currentCompany
        }
        platformAdmin={
          profile?.platform_admin ??
          false
        }
      />

      <main className="flex-1 bg-slate-100 p-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Create Email
        </h1>

        <p className="mt-2 text-slate-600">
          Create and send a standalone
          announcement for{" "}
          <strong>
            {currentCompany.name}
          </strong>
          .
        </p>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
          This is for standalone
          announcements and updates. For
          the regular newsletter, use
          Newsletter Campaign.
        </div>

        <SendAnnouncement
          companySlug={
            currentCompany.slug
          }
          subscriberCount={
            count ?? 0
          }
          companyName={
            currentCompany.name
          }
          logoUrl={
            currentCompany.logo_url
          }
          primaryColour={
            currentCompany.primary_colour
          }
          secondaryColour={
            currentCompany.secondary_colour
          }
        />
      </main>
    </div>
  );
}
