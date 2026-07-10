import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("GET POLLS ERROR:", error);

      return NextResponse.json(error, {
        status: 500,
      });
    }

    return NextResponse.json(data);

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("polls")
      .insert([
        {
          issue_id: body.issue_id,
          question: body.question,
          option1: body.option1,
          option2: body.option2,
          option3: body.option3,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("INSERT POLL ERROR:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });

  } catch (error) {
    console.error("POST POLL ERROR:", error);

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