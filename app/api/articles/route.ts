import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("GET ARTICLES ERROR:", error);

      return NextResponse.json(error, {
        status: 500,
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("GET ARTICLES ERROR:", error);

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("articles")
      .insert([
        {
          issue_id: body.issue_id,
          title: body.title,
          category: body.category,
          author: body.author,
          content: body.content,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("INSERT ARTICLE ERROR:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });

  } catch (error) {
    console.error("POST ARTICLE ERROR:", error);

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