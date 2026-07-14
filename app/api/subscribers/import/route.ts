import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const uploadedSubscribers = body.subscribers ?? [];

    // Load all existing emails
    const { data: existing } = await supabase
      .from("subscribers")
      .select("email");

    const existingEmails = new Set(
      (existing ?? []).map((s: any) =>
        String(s.email).trim().toLowerCase()
      )
    );

    const spreadsheetEmails = new Set<string>();

    const subscribersToImport: any[] = [];

    let skippedExisting = 0;
    let skippedDuplicate = 0;
    let skippedInvalid = 0;

    for (const s of uploadedSubscribers) {
      const email = String(s.email ?? "")
        .trim()
        .toLowerCase();

      if (!email || !email.includes("@")) {
        skippedInvalid++;
        continue;
      }

      // Duplicate inside spreadsheet
      if (spreadsheetEmails.has(email)) {
        skippedDuplicate++;
        continue;
      }

      spreadsheetEmails.add(email);

      // Already exists in Supabase
      if (existingEmails.has(email)) {
        skippedExisting++;
        continue;
      }

      subscribersToImport.push({
        name: s.name,
        company: s.company,
        email,
        member_type: s.member_type ?? "Industry",
      });
    }

    let imported = 0;

    // Import in batches of 200
    const batchSize = 200;

    for (let i = 0; i < subscribersToImport.length; i += batchSize) {
      const batch = subscribersToImport.slice(i, i + batchSize);

      const { error } = await supabase
        .from("subscribers")
        .insert(batch);

      if (error) {
        console.error(error);
        continue;
      }

      imported += batch.length;
    }

    return NextResponse.json({
      success: true,
      imported,
      skippedExisting,
      skippedDuplicate,
      skippedInvalid,
      totalRows: uploadedSubscribers.length,
      totalSubscribers:
        existingEmails.size + imported,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}