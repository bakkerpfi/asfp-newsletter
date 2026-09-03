import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DATABASE_PAGE_SIZE = 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const uploadedSubscribers =
      Array.isArray(body.subscribers)
        ? body.subscribers
        : [];

    // -----------------------------------------
    // LOAD ALL EXISTING SUBSCRIBER EMAILS
    // -----------------------------------------

    const {
      count,
      error: countError,
    } = await supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (countError) {
      throw countError;
    }

    const existingEmails =
      new Set<string>();

    for (
      let from = 0;
      from < (count ?? 0);
      from += DATABASE_PAGE_SIZE
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("subscribers")
        .select("email")
        .order("id", {
          ascending: true,
        })
        .range(
          from,
          from +
            DATABASE_PAGE_SIZE -
            1
        );

      if (error) {
        throw error;
      }

      for (const subscriber of data ?? []) {
        const email =
          String(
            subscriber.email ?? ""
          )
            .trim()
            .toLowerCase();

        if (email) {
          existingEmails.add(email);
        }
      }
    }

    // -----------------------------------------
    // PROCESS UPLOADED SPREADSHEET
    // -----------------------------------------

    const spreadsheetEmails =
      new Set<string>();

    const subscribersToImport: any[] =
      [];

    let skippedExisting = 0;
    let skippedDuplicate = 0;
    let skippedInvalid = 0;

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const s of uploadedSubscribers) {
      const email =
        String(s.email ?? "")
          .trim()
          .toLowerCase();

      const name =
        String(s.name ?? "")
          .trim();

      const company =
        String(s.company ?? "")
          .trim();

      const memberType =
        String(
          s.member_type ??
            "Industry"
        ).trim();

      // ---------------------------------------
      // INVALID EMAIL
      // ---------------------------------------

      if (
        !email ||
        !emailPattern.test(email)
      ) {
        skippedInvalid++;
        continue;
      }

      // ---------------------------------------
      // DUPLICATE INSIDE SPREADSHEET
      // ---------------------------------------

      if (
        spreadsheetEmails.has(email)
      ) {
        skippedDuplicate++;
        continue;
      }

      spreadsheetEmails.add(email);

      // ---------------------------------------
      // ALREADY EXISTS IN SUPABASE
      // ---------------------------------------

      if (
        existingEmails.has(email)
      ) {
        skippedExisting++;
        continue;
      }

      subscribersToImport.push({
        name:
          name || null,

        company:
          company || null,

        email,

        member_type:
          memberType || "Industry",

        active: true,
      });
    }

    // -----------------------------------------
    // IMPORT SUBSCRIBERS
    // -----------------------------------------

    let imported = 0;

    let skippedDatabaseDuplicate =
      0;

    let failed = 0;

    for (
      const subscriber
      of subscribersToImport
    ) {
      const {
        error,
      } = await supabase
        .from("subscribers")
        .insert(subscriber);

      if (error) {
        // Duplicate caught by database
        if (
          error.code === "23505"
        ) {
          skippedDatabaseDuplicate++;
          continue;
        }

        console.error(
          "IMPORT SUBSCRIBER ERROR:",
          subscriber.email,
          error
        );

        failed++;
        continue;
      }

      imported++;

      // Add immediately so the same
      // email cannot be re-imported later
      // in this request.
      existingEmails.add(
        subscriber.email
      );
    }

    // -----------------------------------------
    // RESULT
    // -----------------------------------------

    return NextResponse.json({
      success: true,

      imported,

      skippedExisting,

      skippedDuplicate,

      skippedInvalid,

      skippedDatabaseDuplicate,

      failed,

      totalRows:
        uploadedSubscribers.length,

      totalSubscribers:
        existingEmails.size,
    });

  } catch (error) {
    console.error(
      "SUBSCRIBER IMPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}