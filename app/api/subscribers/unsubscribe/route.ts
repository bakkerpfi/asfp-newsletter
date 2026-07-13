import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "").trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing unsubscribe token.",
        },
        { status: 400 }
      );
    }

    const { data: subscriber, error: findError } = await supabase
      .from("subscribers")
      .select("id, email, active")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (findError) {
      console.error("FIND SUBSCRIBER ERROR:", findError);

      return NextResponse.json(
        {
          success: false,
          error: findError.message,
        },
        { status: 500 }
      );
    }

    if (!subscriber) {
      return NextResponse.json(
        {
          success: false,
          error: "This unsubscribe link is invalid.",
        },
        { status: 404 }
      );
    }

    if (!subscriber.active) {
      return NextResponse.json({
        success: true,
        alreadyUnsubscribed: true,
      });
    }

    const { error: updateError } = await supabase
      .from("subscribers")
      .update({
        active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("UNSUBSCRIBE ERROR:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyUnsubscribed: false,
    });
  } catch (error) {
    console.error("UNSUBSCRIBE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}