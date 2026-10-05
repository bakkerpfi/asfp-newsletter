import { createSupabaseServerClient } from "@/lib/supabase-server";

export type TenantAccess = {
  user: {
    id: string;
    email?: string;
  };

  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_colour: string;
    secondary_colour: string;
    sender_name: string | null;
    sender_email: string | null;
    reply_to_email: string | null;
  };

  role: string;
  platformAdmin: boolean;
};

export async function requireCompanyAccess(
  companySlug: string | null | undefined
): Promise<TenantAccess> {
  if (!companySlug) {
    throw new Error(
      "A company must be selected."
    );
  }

  const supabase =
    await createSupabaseServerClient();

  // -----------------------------------------
  // AUTHENTICATED USER
  // -----------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "Authentication required."
    );
  }

  // -----------------------------------------
  // PROFILE
  // -----------------------------------------

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id,full_name,platform_admin"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error(
      "User profile could not be found."
    );
  }

  // -----------------------------------------
  // COMPANY
  // -----------------------------------------

  const {
    data: company,
    error: companyError,
  } = await supabase
    .from("companies")
    .select(
      `
      id,
      name,
      slug,
      logo_url,
      primary_colour,
      secondary_colour,
      sender_name,
      sender_email,
      reply_to_email
      `
    )
    .eq("slug", companySlug)
    .eq("active", true)
    .single();

  if (companyError || !company) {
    throw new Error(
      "Company could not be found."
    );
  }

  // -----------------------------------------
  // COMPANY MEMBERSHIP
  // -----------------------------------------

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("company_users")
    .select("role")
    .eq("company_id", company.id)
    .eq("user_id", user.id)
    .maybeSingle();

  /*
   * Platform admins can access any company.
   *
   * Normal users MUST have a company_users
   * membership for the requested company.
   */

  if (
    !profile.platform_admin &&
    (membershipError || !membership)
  ) {
    throw new Error(
      "You do not have access to this company."
    );
  }

  return {
    user: {
      id: user.id,
      email:
        user.email ?? undefined,
    },

    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo_url:
        company.logo_url,
      primary_colour:
        company.primary_colour,
      secondary_colour:
        company.secondary_colour,
      sender_name:
        company.sender_name,
      sender_email:
        company.sender_email,
      reply_to_email:
        company.reply_to_email,
    },

    role:
      membership?.role ??
      (profile.platform_admin
        ? "platform_admin"
        : "viewer"),

    platformAdmin:
      profile.platform_admin,
  };
}