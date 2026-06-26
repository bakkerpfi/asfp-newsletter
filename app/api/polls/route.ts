import { NextResponse } from "next/server";
import db from "@/lib/database";
import { initializeDatabase } from "@/lib/init-db";

initializeDatabase();

export async function GET() {
  const polls = db
    .prepare("SELECT * FROM polls ORDER BY id DESC")
    .all();

  return NextResponse.json(polls);
}

export async function POST(request: Request) {
  const body = await request.json();

  db.prepare(`
    INSERT INTO polls
    (
      issue_id,
      question,
      option1,
      option2,
      option3
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    body.issue_id,
    body.question,
    body.option1,
    body.option2,
    body.option3
  );

  return NextResponse.json({
    success: true,
  });
}