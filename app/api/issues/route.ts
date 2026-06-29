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
}