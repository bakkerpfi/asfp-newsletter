import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
  const issues = db.prepare(`
    SELECT *
    FROM issues
  `).all();

  const articles = db.prepare(`
    SELECT *
    FROM articles
  `).all();

  const polls = db.prepare(`
    SELECT *
    FROM polls
  `).all();

  return NextResponse.json({
    issues,
    articles,
    polls,
  });
}