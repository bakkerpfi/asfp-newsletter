import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;

  const articles = db.prepare(`
    SELECT *
    FROM articles
    WHERE issue_id = ?
    ORDER BY id
  `).all(Number(issueId));

  return NextResponse.json(articles);
}