import { NextResponse } from "next/server";
import { buildRecovery } from "@/lib/campaign-recovery";

export async function GET() {
  try {
    const recovery = await buildRecovery();

    return NextResponse.json({
      success: true,
      subscribers: recovery.subscribers,
    });
  } catch (error) {
    console.error("Matched recovery error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load matched subscribers.",
      },
      { status: 500 }
    );
  }
}