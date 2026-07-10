import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const issueId = body.id;

    // Delete articles
    const { error: articlesError } = await supabase
      .from("articles")
      .delete()
      .eq("issue_id", issueId);

    if (articlesError) throw articlesError;

    // Delete polls
    const { error: pollsError } = await supabase
      .from("polls")
      .delete()
      .eq("issue_id", issueId);

    if (pollsError) throw pollsError;

    // Delete issue
    const { error: issueError } = await supabase
      .from("issues")
      .delete()
      .eq("id", issueId);

    if (issueError) throw issueError;

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error("DELETE ISSUE ERROR:", error);

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