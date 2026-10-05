import { NextRequest, NextResponse } from "next/server";
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

    const subscriberId =
      Number(body.id);

    if (
      !Number.isFinite(
        subscriberId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid subscriber ID.",
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
      .from("subscribers")
      .delete()
      .eq(
        "id",
        subscriberId
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
            "Subscriber was not found for this company.",
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