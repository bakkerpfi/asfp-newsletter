import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));

  const next =
    typeof body.next === "string" &&
    body.next.startsWith("/") &&
    !body.next.startsWith("//")
      ? body.next
      : "/login";

  return NextResponse.json({
    success: true,
    next,
  });
}