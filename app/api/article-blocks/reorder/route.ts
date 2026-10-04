import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import {
  requireArticleEditor,
  apiStatus,
} from "@/lib/article-editor-auth";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const tenant =
      await requireArticleEditor(
        String(
          body.companySlug ?? ""
        ).trim()
      );

    const articleId =
      Number(body.article_id);

    const ids: string[] =
      Array.isArray(body.blockIds)
        ? body.blockIds.map(
            (id: unknown) =>
              String(id)
          )
        : [];

    // -----------------------------------------
    // VALIDATE REQUEST
    // -----------------------------------------

    if (
      !Number.isFinite(articleId) ||
      ids.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Article and block order are required.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // VERIFY ARTICLE BELONGS TO COMPANY
    // -----------------------------------------

    const {
      data: article,
      error: articleError,
    } = await supabase
      .from("articles")
      .select("id")
      .eq("id", articleId)
      .eq(
        "company_id",
        tenant.company.id
      )
      .maybeSingle();

    if (articleError) {
      throw articleError;
    }

    if (!article) {
      return NextResponse.json(
        {
          error:
            "Article was not found for this company.",
        },
        {
          status: 404,
        }
      );
    }

    // -----------------------------------------
    // LOAD ARTICLE BLOCKS
    // -----------------------------------------

    const {
      data: existing,
      error: blocksError,
    } = await supabase
      .from("article_blocks")
      .select("id")
      .eq(
        "company_id",
        tenant.company.id
      )
      .eq(
        "article_id",
        articleId
      );

    if (blocksError) {
      throw blocksError;
    }

    const valid =
      new Set<string>(
        (existing ?? []).map(
          (block) =>
            String(block.id)
        )
      );

    // -----------------------------------------
    // VERIFY EXACT BLOCK SET
    // -----------------------------------------

    const invalidOrder =
      ids.length !== valid.size ||
      ids.some(
        (id: string) =>
          !valid.has(id)
      );

    if (invalidOrder) {
      return NextResponse.json(
        {
          error:
            "Block order does not match this article.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // SAVE NEW ORDER
    // -----------------------------------------

    for (
      let index = 0;
      index < ids.length;
      index++
    ) {
      const {
        error: updateError,
      } = await supabase
        .from("article_blocks")
        .update({
          sort_order: index,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          ids[index]
        )
        .eq(
          "company_id",
          tenant.company.id
        )
        .eq(
          "article_id",
          articleId
        );

      if (updateError) {
        throw updateError;
      }
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
      "ARTICLE BLOCK REORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          apiStatus(message),
      }
    );
  }
}