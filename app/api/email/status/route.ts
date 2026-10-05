import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

export async function GET(request: NextRequest) {
  try {
    const companySlug = request.nextUrl.searchParams.get("company");
    const issueId = Number(request.nextUrl.searchParams.get("issueId"));

    const tenant = await requireCompanyAccess(companySlug);
    const companyId = tenant.company.id;

    if (!Number.isFinite(issueId)) {
      return NextResponse.json({ error: "Invalid issue ID." }, { status: 400 });
    }

    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("id,issue_number,title")
      .eq("id", issueId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (issueError) throw issueError;
    if (!issue) {
      return NextResponse.json(
        { error: "Issue was not found for this company." },
        { status: 404 }
      );
    }

    const [activeResult, sentResult] = await Promise.all([
      supabase.from("subscribers").select("*", { count: "exact", head: true })
        .eq("company_id", companyId).eq("active", true),
      supabase.from("newsletter_sends").select("*", { count: "exact", head: true })
        .eq("company_id", companyId).eq("issue_id", issueId).eq("status", "sent"),
    ]);

    if (activeResult.error) throw activeResult.error;
    if (sentResult.error) throw sentResult.error;

    const active = activeResult.count ?? 0;
    const sent = sentResult.count ?? 0;
    const remaining = Math.max(active - sent, 0);

    let status = "Draft";
    if (sent > 0) status = remaining > 0 ? "In Progress" : "Complete";

    return NextResponse.json({
      issue: { id: issue.id, number: issue.issue_number, title: issue.title },
      campaign: { status, activeSubscribers: active, sent, remaining },
      recovery: { matchedSubscribers: 0, unmatchedEmails: 0, csvLogIds: 0, logsRetrieved: 0 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: message === "Authentication required." ? 401 : 403 }
    );
  }
}
