import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pollId = body.pollId;
    const option = body.option;

    // Get current poll
    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();

    if (fetchError) {
      console.error("FETCH POLL ERROR:", fetchError);

      return NextResponse.json(
        {
          success: false,
          error: fetchError.message,
        },
        {
          status: 500,
        }
      );
    }

    let updateData: any = {};

    if (option === 1) {
      updateData.votes1 = poll.votes1 + 1;
    }

    if (option === 2) {
      updateData.votes2 = poll.votes2 + 1;
    }

    if (option === 3) {
      updateData.votes3 = poll.votes3 + 1;
    }

    const { error: updateError } = await supabase
      .from("polls")
      .update(updateData)
      .eq("id", pollId);

    if (updateError) {
      console.error("UPDATE POLL ERROR:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
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
    console.error("VOTE ERROR:", error);

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