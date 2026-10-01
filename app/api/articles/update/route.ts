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

    const tenant =
      await requireCompanyAccess(
        String(
          body.companySlug ?? ""
        ).trim()
      );

    const articleId =
      Number(body.id);

    const issueId =
      Number(body.issue_id);

    if (
      !Number.isFinite(articleId) ||
      !Number.isFinite(issueId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid article or issue ID.",
        },
        {
          status: 400,
        }
      );
    }

    // Verify destination issue belongs
    // to this company.

    const {
      data: issue,
      error: issueError,
    } = await supabase
      .from("issues")
      .select("id")
      .eq("id", issueId)
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

    const {
      data,
      error,
    } = await supabase
      .from("articles")
      .update({
        issue_id:
          issueId,

        title:
          String(
            body.title ?? ""
          ).trim(),

        category:
          String(
            body.category ?? ""
          ).trim() || null,

        author:
          String(
            body.author ?? ""
          ).trim() || null,

        content:
          String(
            body.content ?? ""
          ).trim() || null,
      })
      .eq(
        "id",
        articleId
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
            "Article was not found for this company.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      article: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "UPDATE ARTICLE ERROR:",
      error
    );

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