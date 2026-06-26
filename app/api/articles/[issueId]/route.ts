import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  const articles = db.prepare(`
    SELECT *
    FROM articles
    WHERE issue_id = ?
    ORDER BY id
  `).all(params.issueId);

  return NextResponse.json(articles);
}