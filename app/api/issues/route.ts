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

  const status =
    message ===
    "Authentication required."
      ? 401
      : message.includes("access")
      ? 403
      : 400;

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );
}

// =========================================================
// GET COMPANY ISSUES
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
      .from("issues")
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
      "GET ISSUES ERROR:",
      error
    );

    return errorResponse(error);
  }
}

// =========================================================
// CREATE COMPANY ISSUE
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

    const title =
      String(
        body.title ?? ""
      ).trim();

    const issueNumber =
      String(
        body.issue_number ?? ""
      ).trim();

    const month =
      String(
        body.month ?? ""
      ).trim();

    const year =
      Number(body.year);

    const summary =
      String(
        body.summary ?? ""
      ).trim();

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Issue title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!issueNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Issue number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid year.",
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
      .from("issues")
      .insert({
        company_id:
          tenant.company.id,

        title,

        issue_number:
          issueNumber,

        month:
          month || null,

        year,

        summary:
          summary || null,

        published: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      issue: data,
    });
  } catch (error) {
    console.error(
      "CREATE ISSUE ERROR:",
      error
    );

    return errorResponse(error);
  }
}

// =========================================================
// UPDATE COMPANY ISSUE
// =========================================================

export async function PUT(
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
      Number(body.id);

    if (
      !Number.isFinite(issueId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid issue ID.",
        },
        {
          status: 400,
        }
      );
    }

    const title =
      String(
        body.title ?? ""
      ).trim();

    const issueNumber =
      String(
        body.issue_number ?? ""
      ).trim();

    const month =
      String(
        body.month ?? ""
      ).trim();

    const year =
      Number(body.year);

    const summary =
      String(
        body.summary ?? ""
      ).trim();

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Issue title is required.",
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
      .from("issues")
      .update({
        title,

        issue_number:
          issueNumber,

        month:
          month || null,

        year,

        summary:
          summary || null,
      })
      .eq(
        "id",
        issueId
      )
      .eq(
        "company_id",
        tenant.company.id
      )
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Issue was not found for this company.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      issue: data,
    });
  } catch (error) {
    console.error(
      "UPDATE ISSUE ERROR:",
      error
    );

    return errorResponse(error);
  }
}