import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireArticleEditor,
  apiStatus,
} from "@/lib/article-editor-auth";

const extensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const tenant = await requireArticleEditor(
      String(form.get("companySlug") ?? "").trim()
    );

    const authorId = String(
      form.get("authorId") ?? ""
    ).trim();

    const file = form.get("signature");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Signature image is required.",
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "Signature image must be 5 MB or smaller.",
        },
        { status: 400 }
      );
    }

    const ext = extensions[file.type];

    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Signature must be PNG, JPG or WebP.",
        },
        { status: 400 }
      );
    }

    const {
      data: author,
      error: authorError,
    } = await supabase
      .from("article_authors")
      .select("id")
      .eq("id", authorId)
      .eq(
        "company_id",
        tenant.company.id
      )
      .maybeSingle();

    if (authorError) {
      throw authorError;
    }

    if (!author) {
      return NextResponse.json(
        {
          error:
            "Author was not found for this company.",
        },
        { status: 404 }
      );
    }

    const path =
      `${tenant.company.slug}/signatures/` +
      `${authorId}.${ext}`;

    const { error: uploadError } =
      await supabase.storage
        .from("article-author-photos")
        .upload(
          path,
          await file.arrayBuffer(),
          {
            contentType: file.type,
            upsert: true,
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData } =
      supabase.storage
        .from("article-author-photos")
        .getPublicUrl(path);

    const signature_url =
      `${publicData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } =
      await supabase
        .from("article_authors")
        .update({
          signature_url,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", authorId)
        .eq(
          "company_id",
          tenant.company.id
        );

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      signature_url,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      { error: message },
      {
        status: apiStatus(message),
      }
    );
  }
}