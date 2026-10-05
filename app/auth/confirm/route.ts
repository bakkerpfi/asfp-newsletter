import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "?error=missing_token";

    return NextResponse.redirect(loginUrl);
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } =
    await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

  if (error) {
    console.error(
      "AUTH CONFIRM ERROR:",
      error
    );

    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "?error=auth_failed";

    return NextResponse.redirect(loginUrl);
  }

  const adminUrl = request.nextUrl.clone();

  adminUrl.pathname = "/admin";
  adminUrl.search = "";

  return NextResponse.redirect(adminUrl);
}