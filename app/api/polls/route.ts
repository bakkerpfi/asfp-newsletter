import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

function errorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status:
        message ===
        "Authentication required."
          ? 401
          : message.includes("access")
          ? 403
          : 400,
    }
  );
}

// =========================================================
// GET COMPANY POLLS
// =========================================================

export async function GET(
  request: NextRequest
) {
  try {
    const companySlug =
      request.nextUrl.searchParams.get(
        "company"
      );

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const {
      data,
      error,
    } = await supabase
      .from("polls")
      .select("*")
      .eq(
        "company_id",
        tenant.company.id
      )
      .order("id", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      data ?? []
    );
  } catch (error) {
    console.error(
      "GET POLLS ERROR:",
      error
    );

    return errorResponse(error);
  }
}

// =========================================================
// CREATE COMPANY POLL
// =========================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const companySlug =
      String(
        body.companySlug ?? ""
      ).trim();

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const issueId =
      Number(body.issue_id);

    if (
      !Number.isFinite(issueId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select a valid newsletter issue.",
        },
        {
          status: 400,
        }
      );
    }

    // Verify that the selected issue
    // belongs to this company.

    const {
      data: issue,
      error: issueError,
    } = await supabase
      .from("issues")
      .select("id")
      .eq(
        "id",
        issueId
      )
      .eq(
        "company_id",
        tenant.company.id
      )
      .maybeSingle();

    if (issueError) {
      throw issueError;
    }

    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected issue does not belong to this company.",
        },
        {
          status: 403,
        }
      );
    }

    const question =
      String(
        body.question ?? ""
      ).trim();

    const option1 =
      String(
        body.option1 ?? ""
      ).trim();

    const option2 =
      String(
        body.option2 ?? ""
      ).trim();

    const option3 =
      String(
        body.option3 ?? ""
      ).trim();

    if (
      !question ||
      !option1 ||
      !option2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Question, Option 1 and Option 2 are required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("polls")
      .insert({
        company_id:
          tenant.company.id,

        issue_id:
          issueId,

        question,

        option1,

        option2,

        option3:
          option3 || null,

        votes1: 0,
        votes2: 0,
        votes3: 0,
        active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      poll: data,
    });
  } catch (error) {
    console.error(
      "CREATE POLL ERROR:",
      error
    );

    return errorResponse(error);
  }
}