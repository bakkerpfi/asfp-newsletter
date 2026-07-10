import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;

    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .eq("issue_id", Number(issueId))
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(data ?? []);

  } catch (error) {
    console.error("GET POLLS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}