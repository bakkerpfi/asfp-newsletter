import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
  const row = db.prepare(`
    SELECT rowid, *
    FROM issues
    LIMIT 1
  `).get();

  return NextResponse.json({
    keys: Object.keys(row || {}),
    row,
  });
}import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
  const issues = db.prepare(`
    SELECT *
    FROM issues
    ORDER BY id DESC
  `).all();

  return NextResponse.json(issues);
}

export async function POST(request: Request) {
  const body = await request.json();

  const result = db.prepare(`
    INSERT INTO issues (
      title,
      issue_number,
      month,
      year,
      summary
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    body.title,
    body.issue_number,
    body.month,
    body.year,
    body.summary
  );

  return NextResponse.json({
    success: true,
    id: result.lastInsertRowid,
  });
}