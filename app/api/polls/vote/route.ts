import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function POST(request: Request) {
  const body = await request.json();

  const pollId = body.pollId;
  const option = body.option;

  if (option === 1) {
    db.prepare(`
      UPDATE polls
      SET votes1 = votes1 + 1
      WHERE id = ?
    `).run(pollId);
  }

  if (option === 2) {
    db.prepare(`
      UPDATE polls
      SET votes2 = votes2 + 1
      WHERE id = ?
    `).run(pollId);
  }

  if (option === 3) {
    db.prepare(`
      UPDATE polls
      SET votes3 = votes3 + 1
      WHERE id = ?
    `).run(pollId);
  }

  return NextResponse.json({
    success: true,
  });
}