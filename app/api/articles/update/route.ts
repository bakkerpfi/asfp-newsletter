import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { error } = await supabase
      .from("articles")
      .update({
        issue_id: body.issue_id,
        title: body.title,
        category: body.category,
        author: body.author,
        content: body.content,
      })
      .eq("id", body.id);

    if (error) {
      console.error("UPDATE ARTICLE ERROR:", error);

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

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error("POST UPDATE ERROR:", error);

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