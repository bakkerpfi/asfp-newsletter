import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function POST(request: Request) {
  const body = await request.json();

  db.prepare(`
    UPDATE articles
    SET
      issue_id = ?,
      title = ?,
      category = ?,
      author = ?,
      content = ?
    WHERE id = ?
  `).run(
    body.issue_id,
    body.title,
    body.category,
    body.author,
    body.content,
    body.id
  );

  return NextResponse.json({
    success: true,
  });
}