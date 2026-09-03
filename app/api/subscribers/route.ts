import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// -----------------------------------------
// GET ALL SUBSCRIBERS
// -----------------------------------------

export async function GET() {
  try {
    // Get exact total subscriber count
    const { count, error: countError } = await supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (countError) {
      throw countError;
    }

    const subscribers: any[] = [];
    const pageSize = 1000;

    // Fetch all subscribers in batches of 1000
    for (
      let from = 0;
      from < (count ?? 0);
      from += pageSize
    ) {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .order("name", {
          ascending: true,
        })
        .range(
          from,
          from + pageSize - 1
        );

      if (error) {
        throw error;
      }

      subscribers.push(
        ...(data ?? [])
      );
    }

    return NextResponse.json(
      subscribers
    );

  } catch (error) {
    console.error(
      "GET SUBSCRIBERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

// -----------------------------------------
// ADD NEW SUBSCRIBER
// -----------------------------------------

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    // ---------------------------------------
    // CLEAN INPUT
    // ---------------------------------------

    const cleanEmail =
      String(body.email ?? "")
        .trim()
        .toLowerCase();

    const cleanName =
      String(body.name ?? "")
        .trim();

    const cleanCompany =
      String(body.company ?? "")
        .trim();

    const cleanMemberType =
      String(body.member_type ?? "")
        .trim();

    // ---------------------------------------
    // VALIDATE EMAIL
    // ---------------------------------------

    if (!cleanEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email address is required.",
        },
        {
          status: 400,
        }
      );
    }

    // Basic email validation
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        cleanEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------
    // INSERT SUBSCRIBER
    // ---------------------------------------

    const { data, error } =
      await supabase
        .from("subscribers")
        .insert([
          {
            name:
              cleanName || null,

            company:
              cleanCompany || null,

            email:
              cleanEmail,

            member_type:
              cleanMemberType ||
              null,

            active: true,
          },
        ])
        .select()
        .single();

    if (error) {
      // -------------------------------------
      // DUPLICATE EMAIL
      // -------------------------------------

      if (
        error.code === "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email address already exists.",
          },
          {
            status: 400,
          }
        );
      }

      console.error(
        "INSERT SUBSCRIBER ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    // ---------------------------------------
    // SUCCESS
    // ---------------------------------------

    return NextResponse.json({
      success: true,
      id: data.id,
      subscriber: data,
    });

  } catch (error) {
    console.error(
      "POST SUBSCRIBER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}