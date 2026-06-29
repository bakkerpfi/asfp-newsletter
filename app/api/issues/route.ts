import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET() {
  try {
    const issues = db.prepare(`
      SELECT *
      FROM issues
    `).all();

    return NextResponse.json(issues);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}