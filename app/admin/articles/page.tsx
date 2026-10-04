import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ company?: string }>;
};

export default async function NewsletterBuilderEntry({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_admin")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id);

  let companyIds = memberships?.map((m) => m.company_id) ?? [];

  if (profile?.platform_admin) {
    const { data: allCompanies } = await supabase
      .from("companies")
      .select("id")
      .eq("active", true);
    companyIds = allCompanies?.map((c) => c.id) ?? [];
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("id,slug")
    .in("id", companyIds)
    .eq("active", true)
    .order("name");

  if (!companies?.length) redirect("/admin");

  const company =
    (params.company
      ? companies.find((c) => c.slug === params.company)
      : null) ?? companies[0];

  const { data: issue } = await supabase
    .from("issues")
    .select("id")
    .eq("company_id", company.id)
    .order("year", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!issue) {
    redirect(`/admin/issues?company=${encodeURIComponent(company.slug)}`);
  }

  redirect(
    `/admin/issues/${issue.id}?company=${encodeURIComponent(company.slug)}`
  );
}
