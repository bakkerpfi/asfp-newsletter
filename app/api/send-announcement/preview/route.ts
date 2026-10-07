import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";
import { createEmailHtml } from "@/app/api/send-announcement/route";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const companySlug = String(
      body.companySlug ?? ""
    ).trim();

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const companyId =
      tenant.company.id;

    const {
      data: company,
      error: companyError,
    } = await supabase
      .from("companies")
      .select(
        "id,name,slug,logo_url,primary_colour,secondary_colour,sender_name,sender_email,reply_to_email,website_url,company_address,footer_phone,footer_tagline,footer_show_address,footer_show_phone,footer_show_website"
      )
      .eq("id", companyId)
      .eq("active", true)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Company could not be loaded.",
        },
        { status: 404 }
      );
    }

    let author: {
      id: string;
      name: string;
      job_title: string | null;
      signature_url: string | null;
    } | null = null;

    if (body.includeSignature) {
      const authorId = String(
        body.authorId ?? ""
      ).trim();

      if (authorId) {
        const {
          data: authorRow,
          error: authorError,
        } = await supabase
          .from("article_authors")
          .select(
            "id,name,job_title,signature_url"
          )
          .eq("id", authorId)
          .eq(
            "company_id",
            companyId
          )
          .eq("active", true)
          .maybeSingle();

        if (authorError) {
          throw authorError;
        }

        author = authorRow;
      }
    }

    const html =
      createEmailHtml({
        subscriber: {
          id: 0,
          name: "Ben",
          email: "preview@codexus.co.nz",
          unsubscribe_token:
            "preview",
        },

        company,

        heading: String(
          body.heading ?? ""
        ),

        content: String(
          body.content ?? ""
        ),

        buttonText: String(
          body.buttonText ?? ""
        ),

        buttonLink: String(
          body.buttonLink ?? ""
        ),

        author,
      });

    return NextResponse.json({
      success: true,
      html,
    });
  } catch (error) {
    console.error(
      "ANNOUNCEMENT PREVIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate email preview.",
      },
      { status: 500 }
    );
  }
}