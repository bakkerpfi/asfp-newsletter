import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
  const sponsors = db
    .prepare("SELECT * FROM sponsors ORDER BY name")
    .all();

  return NextResponse.json(sponsors);
}

export async function POST(request: Request) {
  const body = await request.json();

  db.prepare(`
    INSERT INTO sponsors
    (name, website, logo)
    VALUES (?, ?, ?)
  `).run(
    body.name,
    body.website,
    body.logo
  );

  return NextResponse.json({
    success: true,
  });
}