import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const DATABASE_PAGE_SIZE = 1000;

export async function GET(request: NextRequest) {
  try {
    const companySlug =
      request.nextUrl.searchParams.get("company");

    const tenant =
      await requireCompanyAccess(companySlug);

    const companyId =
      tenant.company.id;

    const {
      data: campaign,
      error: campaignError,
    } = await supabase
      .from("announcement_campaigns")
      .select(
        "id,subject,heading,content,button_text,button_link,status,created_at,started_at,completed_at"
      )
      .eq("company_id", companyId)
      .in("status", [
        "sending",
        "partial",
      ])
      .order("id", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (campaignError) {
      throw campaignError;
    }

    if (!campaign) {
      return NextResponse.json({
        success: true,
        campaign: null,
      });
    }

    const campaignId =
      Number(campaign.id);

    const {
      count: sentCount,
      error: sentError,
    } = await supabase
      .from("announcement_sends")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq(
        "campaign_id",
        campaignId
      )
      .eq("status", "sent");

    if (sentError) {
      throw sentError;
    }

    const {
      count: rawActiveCount,
      error: activeError,
    } = await supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("active", true);

    if (activeError) {
      throw activeError;
    }

    const uniqueEmails =
      new Set<string>();

    for (
      let from = 0;
      from < (rawActiveCount ?? 0);
      from += DATABASE_PAGE_SIZE
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("subscribers")
        .select("email")
        .eq("company_id", companyId)
        .eq("active", true)
        .order("id", {
          ascending: true,
        })
        .range(
          from,
          from +
            DATABASE_PAGE_SIZE -
            1
        );

      if (error) {
        throw error;
      }

      for (
        const row of data ?? []
      ) {
        const email =
          String(row.email ?? "")
            .trim()
            .toLowerCase();

        if (email) {
          uniqueEmails.add(email);
        }
      }
    }

    const totalSubscribers =
      uniqueEmails.size;

    const sent =
      sentCount ?? 0;

    const remaining =
      Math.max(
        totalSubscribers - sent,
        0
      );

    if (remaining === 0) {
      await supabase
        .from("announcement_campaigns")
        .update({
          status: "completed",
          completed_at:
            campaign.completed_at ||
            new Date().toISOString(),
        })
        .eq("company_id", companyId)
        .eq("id", campaignId);

      return NextResponse.json({
        success: true,
        campaign: null,
      });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaignId,
        subject:
          campaign.subject,
        heading:
          campaign.heading,
        content:
          campaign.content,
        buttonText:
          campaign.button_text,
        buttonLink:
          campaign.button_link,
        status:
          campaign.status,
        createdAt:
          campaign.created_at,
        startedAt:
          campaign.started_at,
        totalSubscribers,
        sent,
        remaining,
      },
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
