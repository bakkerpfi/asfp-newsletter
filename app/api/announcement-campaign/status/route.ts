import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DATABASE_PAGE_SIZE = 1000;

/*
 * Returns the most recent announcement campaign
 * that has not been completed.
 *
 * This allows the admin page to recover a campaign
 * after a browser refresh, lost connection or timeout.
 */
export async function GET() {
  try {
    // Find the latest unfinished campaign
    const {
      data: campaign,
      error: campaignError,
    } = await supabase
      .from("announcement_campaigns")
      .select(
        `
        id,
        subject,
        heading,
        content,
        button_text,
        button_link,
        status,
        created_at,
        started_at,
        completed_at
        `
      )
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
      throw new Error(
        campaignError.message
      );
    }

    // No unfinished campaign exists
    if (!campaign) {
      return NextResponse.json({
        success: true,
        campaign: null,
      });
    }

    const campaignId =
      Number(campaign.id);

    // Count how many recipients have
    // already been recorded as sent
    const {
      count: sentCount,
      error: sentCountError,
    } = await supabase
      .from("announcement_sends")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "campaign_id",
        campaignId
      )
      .eq("status", "sent");

    if (sentCountError) {
      throw new Error(
        sentCountError.message
      );
    }

    // Count unique active subscriber emails.
    // We load them because duplicate subscriber
    // records may share the same email address.
    const {
      count: rawActiveCount,
      error: activeCountError,
    } = await supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true);

    if (activeCountError) {
      throw new Error(
        activeCountError.message
      );
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
        throw new Error(
          error.message
        );
      }

      for (const row of data ?? []) {
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
    console.error(
      "ANNOUNCEMENT CAMPAIGN STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error.",
      },
      {
        status: 500,
      }
    );
  }
}