import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("subscribers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("GET SUBSCRIBERS ERROR:", error);

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

    return NextResponse.json(data);

  } catch (error) {
    console.error("GET SUBSCRIBERS ERROR:", error);

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
      .from("subscribers")
      .insert([
        {
          name: body.name,
          company: body.company,
          email: body.email,
          member_type: body.member_type,
        },
      ])
      .select()
      .single();

    if (error) {

      // Duplicate email
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "This email address already exists.",
          },
          {
            status: 400,
          }
        );
      }

      console.error("INSERT SUBSCRIBER ERROR:", error);

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
      id: data.id,
    });

  } catch (error) {
    console.error("POST SUBSCRIBER ERROR:", error);

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