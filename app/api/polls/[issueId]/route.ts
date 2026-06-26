import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;

  const polls = db.prepare(`
    SELECT *
    FROM polls
    WHERE issue_id = ?
  `).all(Number(issueId));

  return NextResponse.json(polls);
}