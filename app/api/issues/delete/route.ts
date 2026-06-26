import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function POST(request: Request) {
  const body = await request.json();

  const issueId = body.id;

  db.prepare(`
    DELETE FROM articles
    WHERE issue_id = ?
  `).run(issueId);

  db.prepare(`
    DELETE FROM polls
    WHERE issue_id = ?
  `).run(issueId);

  db.prepare(`
    DELETE FROM issues
    WHERE id = ?
  `).run(issueId);

  return NextResponse.json({
    success: true,
  });
}