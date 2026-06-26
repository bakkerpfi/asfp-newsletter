import { NextResponse } from "next/server";
import db from "@/lib/database";
import { initializeDatabase } from "@/lib/init-db";

initializeDatabase();

export async function GET() {
  const articles = db
    .prepare("SELECT * FROM articles ORDER BY id DESC")
    .all();

  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  const body = await request.json();

  db.prepare(`
    INSERT INTO articles
    (issue_id, title, category, author, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    body.issue_id,
    body.title,
    body.category,
    body.author,
    body.content
  );

  return NextResponse.json({
    success: true,
  });
}