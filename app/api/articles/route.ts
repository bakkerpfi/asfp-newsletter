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
// GET COMPANY ARTICLES
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
      .from("articles")
      .select("*")
      .eq(
        "company_id",
        tenant.company.id
      )
.order("id", {
  ascending: true,
});

    if (error) {
      throw error;
    }

    return NextResponse.json(
      data ?? []
    );
  } catch (error) {
    console.error(
      "GET ARTICLES ERROR:",
      error
    );

    return errorResponse(error);
  }
}

// =========================================================
// CREATE COMPANY ARTICLE
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

    // Verify selected issue belongs
    // to selected company.

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

    const title =
      String(
        body.title ?? ""
      ).trim();

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Article title is required.",
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
      .from("articles")
      .insert({
        company_id:
          tenant.company.id,

        issue_id:
          issueId,

        title,

        category:
          String(
            body.category ?? ""
          ).trim() || null,

        author:
          String(
            body.author ?? ""
          ).trim() || null,

        author_id:
          body.author_id || null,

        content:
          String(
            body.content ?? ""
          ).trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      article: data,
    });
  } catch (error) {
    console.error(
      "CREATE ARTICLE ERROR:",
      error
    );

    return errorResponse(error);
  }
}
