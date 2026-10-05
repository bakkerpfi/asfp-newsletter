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

    if (
      !Number.isFinite(articleId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid article ID.",
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
      .delete()
      .eq(
        "id",
        articleId
      )
      .eq(
        "company_id",
        tenant.company.id
      )
      .select("id")
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
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "DELETE ARTICLE ERROR:",
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