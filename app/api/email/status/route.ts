import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: latestIssue, error: issueError } =
    await supabase
      .from("issues")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single();

  if (issueError || !latestIssue) {
    return NextResponse.json(
      { error: "No newsletter issue found." },
      { status: 404 }
    );
  }

  const issueId = latestIssue.id;

  const [
    activeSubscribersResult,
    sentResult,
  ] = await Promise.all([
    supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    supabase
      .from("newsletter_sends")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("issue_id", issueId)
      .eq("status", "sent"),
  ]);

  const active =
    activeSubscribersResult.count ?? 0;

  const sentCount =
    sentResult.count ?? 0;

  const remaining =
    Math.max(active - sentCount, 0);

  let status = "Draft";

  if (sentCount > 0) {
    status =
      remaining > 0
        ? "In Progress"
        : "Complete";
  }

  return NextResponse.json({
    issue: {
      id: latestIssue.id,
      number: latestIssue.issue_number,
      title: latestIssue.title,
    },

    campaign: {
      status,
      activeSubscribers: active,
      sent: sentCount,
      remaining,
    },

    recovery: {
      matchedSubscribers: 0,
      unmatchedEmails: 0,
      csvLogIds: 0,
      logsRetrieved: 0,
    },
  });
}