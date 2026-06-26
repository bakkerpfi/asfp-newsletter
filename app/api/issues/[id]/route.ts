import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const issue = db.prepare(`
    SELECT *
    FROM issues
    WHERE id = ?
  `).get(Number(id));

  return NextResponse.json(issue);
}