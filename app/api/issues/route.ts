import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("id", { ascending: false });

    console.log("GET DATA:", data);
    console.log("GET ERROR:", error);

    if (error) {
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("GET ERROR:", error);

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
      .from("issues")
      .insert([
        {
          title: body.title,
          issue_number: body.issue_number,
          month: body.month,
          year: Number(body.year),
          summary: body.summary,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });

  } catch (error) {
    console.error("POST ERROR:", error);

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