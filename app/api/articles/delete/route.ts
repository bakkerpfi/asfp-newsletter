import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function POST(request: Request) {
  const body = await request.json();

  db.prepare(`
    DELETE FROM articles
    WHERE id = ?
  `).run(body.id);

  return NextResponse.json({
    success: true,
  });
}