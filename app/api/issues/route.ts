import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
const issues = JSON.parse(
  JSON.stringify(
    db.prepare(`
      SELECT *
      FROM issues
    `).all()
  )
);

const articles = JSON.parse(
  JSON.stringify(
    db.prepare(`
      SELECT *
      FROM articles
    `).all()
  )
);

const polls = JSON.parse(
  JSON.stringify(
    db.prepare(`
      SELECT *
      FROM polls
    `).all()
  )
);

return NextResponse.json({
  issues,
  articles,
  polls,
});
}