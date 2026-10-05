import AdminSidebar from "@/components/AdminSidebar";
import CompanyInviteManager from "@/components/CompanyInviteManager";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function CompaniesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles")
    .select("platform_admin").eq("id", user.id).single();
  if (!profile?.platform_admin) redirect("/admin");

  const { data: companies } = await supabase.from("companies")
    .select("id,name,slug,logo_url,primary_colour,secondary_colour,active,created_at")
    .order("name", { ascending: true });

  const { data: invitations } = await supabase.from("company_invitations")
    .select("id,company_id,contact_name,contact_email,token,role,status,expires_at,created_at,companies(name,slug)")
    .order("created_at", { ascending: false });

  const activeCompanies = (companies ?? []).filter((c:any) => c.active);
  const currentCompany = activeCompanies[0] ?? null;

  return (
    <div className="flex">
      <AdminSidebar companies={activeCompanies} currentCompany={currentCompany} platformAdmin />
      <main className="flex-1 bg-slate-100 p-10">
        <h1 className="text-4xl font-bold text-slate-900">Companies</h1>
        <p className="mt-2 text-slate-600">Invite and manage companies using Codexus Newsletter.</p>
        <CompanyInviteManager
          initialCompanies={(companies ?? []) as any}
          initialInvitations={(invitations ?? []) as any}
        />
      </main>
    </div>
  );
}
