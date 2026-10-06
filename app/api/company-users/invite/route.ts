import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

function cleanEmail(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(
      /[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\u2060\uFEFF]/g,
      ""
    )
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

async function requirePlatformAdmin() {
  const auth = await createSupabaseServerClient();

  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: profile } = await auth
    .from("profiles")
    .select("platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.platform_admin) {
    throw new Error(
      "Platform administrator access is required."
    );
  }

  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePlatformAdmin();
    const body = await request.json();

    const companyId = String(body.companyId ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    const contactEmail = cleanEmail(body.contactEmail);

    if (!companyId || !contactName || !contactEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Company, contact name and contact email are required.",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const { data: company, error: companyError } =
      await supabase
        .from("companies")
        .select("id,name,slug")
        .eq("id", companyId)
        .eq("active", true)
        .single();

    if (companyError || !company) {
      throw companyError ?? new Error("Company not found.");
    }

    // Prevent duplicate pending invitations.
    const { data: existingInvitation } = await supabase
      .from("company_invitations")
      .select("id,status")
      .eq("company_id", companyId)
      .eq("contact_email", contactEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A pending invitation already exists for this email.",
        },
        { status: 409 }
      );
    }

    const { data: invitation, error: invitationError } =
      await supabase
        .from("company_invitations")
        .insert({
          company_id: company.id,
          contact_name: contactName,
          contact_email: contactEmail,
          role: "company_admin",
          status: "pending",
          invited_by: user.id,
        })
        .select(
          "id,company_id,contact_name,contact_email,token,role,status,expires_at,created_at"
        )
        .single();

    if (invitationError || !invitation) {
      throw (
        invitationError ??
        new Error("Invitation could not be created.")
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        ...invitation,
        companies: {
          name: company.name,
          slug: company.slug,
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const status =
      message === "Authentication required."
        ? 401
        : message.includes("Platform administrator")
          ? 403
          : 400;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}