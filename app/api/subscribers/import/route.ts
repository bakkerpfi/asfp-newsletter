import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const DATABASE_PAGE_SIZE = 1000;

function cleanEmailAddress(
  value: unknown
) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(
      /[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\u2060\uFEFF]/g,
      ""
    )
    .replace(/\s+/g, "")
    .replace(/[.,;:]+$/g, "")
    .trim()
    .toLowerCase();
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const companySlug =
      String(
        body.companySlug ?? ""
      ).trim();

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const companyId =
      tenant.company.id;

    const uploadedSubscribers =
      Array.isArray(
        body.subscribers
      )
        ? body.subscribers
        : [];

    // -----------------------------------------
    // LOAD EXISTING EMAILS FOR THIS COMPANY ONLY
    // -----------------------------------------

    const {
      count,
      error: countError,
    } = await supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "company_id",
        companyId
      );

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
        .eq(
          "company_id",
          companyId
        )
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

      for (
        const subscriber of
          data ?? []
      ) {
        const email =
          cleanEmailAddress(
            subscriber.email
          );

        if (email) {
          existingEmails.add(
            email
          );
        }
      }
    }

    // -----------------------------------------
    // PROCESS SPREADSHEET
    // -----------------------------------------

    const spreadsheetEmails =
      new Set<string>();

    const subscribersToImport:
      Array<{
        company_id: string;
        name: string | null;
        company: string | null;
        email: string;
        member_type: string;
        active: boolean;
      }> = [];

    let skippedExisting = 0;
    let skippedDuplicate = 0;
    let skippedInvalid = 0;

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (
      const subscriber of
        uploadedSubscribers
    ) {
      const email =
        cleanEmailAddress(
          subscriber.email
        );

      const name =
        String(
          subscriber.name ?? ""
        ).trim();

      const subscriberCompany =
        String(
          subscriber.company ?? ""
        ).trim();

      const memberType =
        String(
          subscriber.member_type ??
            "Industry"
        ).trim();

      if (
        !email ||
        !emailPattern.test(
          email
        )
      ) {
        skippedInvalid++;
        continue;
      }

      if (
        spreadsheetEmails.has(
          email
        )
      ) {
        skippedDuplicate++;
        continue;
      }

      spreadsheetEmails.add(
        email
      );

      if (
        existingEmails.has(
          email
        )
      ) {
        skippedExisting++;
        continue;
      }

      subscribersToImport.push({
        company_id:
          companyId,

        name:
          name || null,

        company:
          subscriberCompany ||
          null,

        email,

        member_type:
          memberType ||
          "Industry",

        active: true,
      });
    }

    // -----------------------------------------
    // INSERT
    // -----------------------------------------

    let imported = 0;
    let skippedDatabaseDuplicate =
      0;
    let failed = 0;

    for (
      const subscriber of
        subscribersToImport
    ) {
      const {
        error,
      } = await supabase
        .from("subscribers")
        .insert(subscriber);

      if (error) {
        if (
          error.code ===
          "23505"
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

      existingEmails.add(
        subscriber.email
      );
    }

    return NextResponse.json({
      success: true,

      company:
        tenant.company.name,

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
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          message ===
          "Authentication required."
            ? 401
            : 403,
      }
    );
  }
}