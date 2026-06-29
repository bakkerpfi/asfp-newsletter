import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
  try {
    const tables = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type='table'
    `).all();

    return NextResponse.json(tables);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}