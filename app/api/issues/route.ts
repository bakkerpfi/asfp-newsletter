import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
  const issue = db.prepare(`
    PRAGMA table_info(issues)
  `).all();

  return NextResponse.json(issue);
}