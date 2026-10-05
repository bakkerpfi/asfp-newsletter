import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

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

    /*
     * Verify the issue belongs to the
     * selected company before deleting
     * anything associated with it.
     */

    const {
      data: issue,
      error: issueLookupError,
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

    if (issueLookupError) {
      throw issueLookupError;
    }

    if (!issue) {
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

    // Delete this company's articles
    // belonging to the issue.

    const {
      error: articlesError,
    } = await supabase
      .from("articles")
      .delete()
      .eq(
        "issue_id",
        issueId
      )
      .eq(
        "company_id",
        tenant.company.id
      );

    if (articlesError) {
      throw articlesError;
    }

    // Delete this company's polls
    // belonging to the issue.

    const {
      error: pollsError,
    } = await supabase
      .from("polls")
      .delete()
      .eq(
        "issue_id",
        issueId
      )
      .eq(
        "company_id",
        tenant.company.id
      );

    if (pollsError) {
      throw pollsError;
    }

    // Delete issue itself.

    const {
      error: issueError,
    } = await supabase
      .from("issues")
      .delete()
      .eq(
        "id",
        issueId
      )
      .eq(
        "company_id",
        tenant.company.id
      );

    if (issueError) {
      throw issueError;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE ISSUE ERROR:",
      error
    );

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
            : 403,
      }
    );
  }
}