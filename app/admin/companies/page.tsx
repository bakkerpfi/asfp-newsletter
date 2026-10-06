import AdminSidebar from "@/components/AdminSidebar";
import CompanyInviteManager from "@/components/CompanyInviteManager";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase as adminSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function CompaniesPage() {
  // Authenticated user client.
  const auth = await createSupabaseServerClient();

  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Security check must use the authenticated user's session.
  const { data: profile } = await auth
    .from("profiles")
    .select("platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.platform_admin) {
    redirect("/admin");
  }

  /*
   * From this point onward the user has been verified
   * as a Codexus platform administrator.
   *
   * Platform-wide management data is loaded through
   * the server-side service-role client so tenant RLS
   * does not hide companies or invitations.
   */

  const { data: companies, error: companiesError } =
    await adminSupabase
      .from("companies")
      .select(
        "id,name,slug,logo_url,primary_colour,secondary_colour,active,created_at"
      )
      .order("name", { ascending: true });

  if (companiesError) {
    throw companiesError;
  }

  const { data: invitations, error: invitationsError } =
    await adminSupabase
      .from("company_invitations")
      .select(
        "id,company_id,contact_name,contact_email,token,role,status,expires_at,created_at,companies(name,slug)"
      )
      .order("created_at", { ascending: false });

  if (invitationsError) {
    throw invitationsError;
  }

  const activeCompanies =
    (companies ?? []).filter(
      (company: any) => company.active
    );

  const currentCompany =
    activeCompanies[0] ?? null;

  return (
    <div className="flex">
      <AdminSidebar
        companies={activeCompanies}
        currentCompany={currentCompany}
        platformAdmin
      />

      <main className="flex-1 bg-slate-100 p-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Companies
        </h1>

        <p className="mt-2 text-slate-600">
          Invite and manage companies using Codexus Newsletter.
        </p>

        <CompanyInviteManager
          initialCompanies={(companies ?? []) as any}
          initialInvitations={(invitations ?? []) as any}
        />
      </main>
    </div>
  );
}