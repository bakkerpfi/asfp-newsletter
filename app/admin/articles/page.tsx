import AdminSidebar from "@/components/AdminSidebar";
import ArticlesManager from "@/components/ArticlesManager";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type ArticlesPageProps = {
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

export default async function ArticlesPage({
  searchParams,
}: ArticlesPageProps) {
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
      .select(
        "id,full_name,platform_admin"
      )
      .eq("id", user.id)
      .single();

  const { data: memberships } =
    await supabase
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

  let companies: Company[] = [];

  if (companyIds.length > 0) {
    const { data } =
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

    companies =
      (data ?? []) as Company[];
  }

  if (companies.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-8">

        <div className="max-w-lg rounded-xl bg-white p-10 text-center shadow">

          <h1 className="text-2xl font-bold">
            No Company Access
          </h1>

          <p className="mt-4 text-slate-600">
            Your account has not been
            assigned to an organisation.
          </p>

        </div>

      </main>
    );
  }

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

        <h1
          className="text-4xl font-bold"
          style={{
            color:
              currentCompany.primary_colour,
          }}
        >
          Articles
        </h1>

        <p className="mt-2 text-slate-600">
          Create and manage newsletter
          articles for{" "}
          <strong>
            {currentCompany.name}
          </strong>
          .
        </p>

        <ArticlesManager
          currentCompany={
            currentCompany
          }
        />

      </main>

    </div>
  );
}