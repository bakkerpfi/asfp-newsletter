import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const token = String(
      body.token ?? ""
    ).trim();

    const approverName = String(
      body.approverName ?? ""
    ).trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Approval token is required.",
        },
        { status: 400 }
      );
    }

    if (!approverName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter your name.",
        },
        { status: 400 }
      );
    }

    const {
      data: campaign,
      error: campaignError,
    } = await supabase
      .from("announcement_campaigns")
      .select(
        "id,status,proof_email,approved_at"
      )
      .eq("approval_token", token)
      .maybeSingle();

    if (campaignError) {
      throw campaignError;
    }

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This approval request could not be found.",
        },
        { status: 404 }
      );
    }

    if (campaign.approved_at) {
      return NextResponse.json({
        success: true,
        alreadyApproved: true,
      });
    }

    if (
      campaign.status !== "proof_sent"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This email is not currently awaiting approval.",
        },
        { status: 409 }
      );
    }

    const now =
      new Date().toISOString();

    const { error: updateError } =
      await supabase
        .from("announcement_campaigns")
        .update({
          status: "approved",
          approved_at: now,
          approved_by_name:
            approverName,
          approved_by_email:
            campaign.proof_email,
          updated_at: now,
        })
        .eq("id", campaign.id)
        .eq(
          "status",
          "proof_sent"
        );

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      alreadyApproved: false,
      approvedAt: now,
    });
  } catch (error) {
    console.error(
      "ANNOUNCEMENT APPROVAL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to approve this email.",
      },
      { status: 500 }
    );
  }
}