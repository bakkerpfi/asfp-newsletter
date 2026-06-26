import { NextResponse } from "next/server";
import db from "@/lib/database";
import { initializeDatabase } from "@/lib/init-db";

initializeDatabase();

export async function GET() {
  const subscribers = db
    .prepare("SELECT * FROM subscribers ORDER BY name")
    .all();

  return NextResponse.json(subscribers);
}

export async function POST(request: Request) {
  const body = await request.json();

  const stmt = db.prepare(`
    INSERT INTO subscribers
    (name, company, email, member_type)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(
    body.name,
    body.company,
    body.email,
    body.member_type
  );

  return NextResponse.json({
    success: true,
  });
}