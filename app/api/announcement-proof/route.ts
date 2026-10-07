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
    const body = await request.json();

    const companySlug = String(
      body.companySlug ?? ""
    ).trim();

    const subject = String(
      body.subject ?? ""
    ).trim();

    const heading = String(
      body.heading ?? ""
    ).trim();

    const content = String(
      body.content ?? ""
    ).trim();

    const buttonText = String(
      body.buttonText ?? ""
    ).trim();

    const buttonLink = String(
      body.buttonLink ?? ""
    ).trim();

    const proofEmail = String(
      body.proofEmail ?? ""
    )
      .trim()
      .toLowerCase();

    const includeSignature =
      body.includeSignature === true;

    const authorId = includeSignature
      ? String(
          body.authorId ?? ""
        ).trim()
      : null;

    if (!subject || !content) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Subject and email content are required.",
        },
        { status: 400 }
      );
    }

    if (!proofEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Proof email address is required.",
        },
        { status: 400 }
      );
    }

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const companyId =
      tenant.company.id;

    if (includeSignature) {
      if (!authorId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please select an author for the email sign-off.",
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
          companyId
        )
        .eq("active", true)
        .maybeSingle();

      if (authorError) {
        throw authorError;
      }

      if (!author) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected author is not available for this company.",
          },
          { status: 400 }
        );
      }
    }

    const {
      data: campaign,
      error,
    } = await supabase
      .from("announcement_campaigns")
      .insert({
        company_id: companyId,
        subject,
        heading:
          heading || null,
        content,
        button_text:
          buttonText || null,
        button_link:
          buttonLink || null,

        author_id:
          authorId || null,

        include_signature:
          includeSignature,

        proof_email:
          proofEmail,

        status:
          "draft",

        updated_at:
          new Date().toISOString(),
      })
      .select(
        "id,approval_token,status"
      )
      .single();

    if (error || !campaign) {
      throw (
        error ||
        new Error(
          "Unable to save email proof."
        )
      );
    }

    return NextResponse.json({
      success: true,
      campaignId:
        Number(campaign.id),
      approvalToken:
        campaign.approval_token,
      status:
        campaign.status,
    });
  } catch (error) {
    console.error(
      "SAVE ANNOUNCEMENT PROOF ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save email proof.",
      },
      { status: 500 }
    );
  }
}