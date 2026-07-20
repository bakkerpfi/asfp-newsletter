import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 100;
const DATABASE_PAGE_SIZE = 1000;

type Subscriber = {
  id: number;
  name: string | null;
  email: string;
};

export async function GET() {
  try {
    // Load latest issue
    const {
      data: latestIssue,
      error: issueError,
    } = await supabase
      .from("issues")
      .select("id, issue_number, title")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (issueError || !latestIssue) {
      return NextResponse.json(
        {
          error: "No newsletter issue found.",
        },
        {
          status: 404,
        }
      );
    }

    // Count active subscribers
    const {
      count,
      error: countError,
    } = await supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true);

    if (countError) {
      return NextResponse.json(
        {
          error: countError.message,
        },
        {
          status: 500,
        }
      );
    }

    // Load subscribers in exactly the same order
    // as send-newsletter.ts
    const subscribers: Subscriber[] = [];

    for (
      let from = 0;
      from < (count ?? 0);
      from += DATABASE_PAGE_SIZE
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("subscribers")
        .select("id,name,email")
        .eq("active", true)
        .order("name", {
          ascending: true,
        })
        .range(
          from,
          from + DATABASE_PAGE_SIZE - 1
        );

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          {
            status: 500,
          }
        );
      }

      subscribers.push(
        ...(data ?? [])
      );
    }

    // Load successful sends
    const {
      data: sentRows,
      error: sentError,
    } = await supabase
      .from("newsletter_sends")
      .select("subscriber_id")
      .eq("issue_id", latestIssue.id)
      .eq("status", "sent");

    if (sentError) {
      return NextResponse.json(
        {
          error: sentError.message,
        },
        {
          status: 500,
        }
      );
    }

    const sentSet = new Set(
      (sentRows ?? []).map(
        (row) => row.subscriber_id
      )
    );

    // Build batches
    const batches = [];

    for (
      let i = 0;
      i < subscribers.length;
      i += BATCH_SIZE
    ) {
      const batchSubscribers =
        subscribers.slice(
          i,
          i + BATCH_SIZE
        );

      const sentCount =
        batchSubscribers.filter(
          (subscriber) =>
            sentSet.has(subscriber.id)
        ).length;

      batches.push({
        batch:
          Math.floor(i / BATCH_SIZE) + 1,

        start: i + 1,

        end:
          i +
          batchSubscribers.length,

        count:
          batchSubscribers.length,

        sent: sentCount,

        remaining:
          batchSubscribers.length -
          sentCount,

        complete:
          sentCount ===
          batchSubscribers.length,
      });
    }

    return NextResponse.json({
      issue: latestIssue,
      totalSubscribers:
        subscribers.length,
      totalSent: sentSet.size,
      totalRemaining:
        subscribers.length -
        sentSet.size,
      batchSize: BATCH_SIZE,
      batches,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
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