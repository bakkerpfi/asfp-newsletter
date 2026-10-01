import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";
import * as XLSX from "xlsx";

const DATABASE_PAGE_SIZE = 1000;

export async function GET(
  request: NextRequest
) {
  try {
    const companySlug =
      request.nextUrl.searchParams.get(
        "company"
      );

    const status =
      request.nextUrl.searchParams.get(
        "status"
      ) ?? "active";

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const companyId =
      tenant.company.id;

    // -----------------------------------------
    // COUNT COMPANY SUBSCRIBERS
    // -----------------------------------------

    let countQuery =
      supabase
        .from("subscribers")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "company_id",
          companyId
        );

    if (
      status === "active"
    ) {
      countQuery =
        countQuery.eq(
          "active",
          true
        );
    } else if (
      status === "inactive"
    ) {
      countQuery =
        countQuery.eq(
          "active",
          false
        );
    }

    const {
      count,
      error: countError,
    } = await countQuery;

    if (countError) {
      throw countError;
    }

    const subscribers:
      any[] = [];

    // -----------------------------------------
    // LOAD COMPANY SUBSCRIBERS
    // -----------------------------------------

    for (
      let from = 0;
      from < (count ?? 0);
      from += DATABASE_PAGE_SIZE
    ) {
      let pageQuery =
        supabase
          .from("subscribers")
          .select(
            `
            name,
            company,
            email,
            member_type,
            active,
            created_at
            `
          )
          .eq(
            "company_id",
            companyId
          )
          .order("name", {
            ascending: true,
          })
          .range(
            from,
            from +
              DATABASE_PAGE_SIZE -
              1
          );

      if (
        status === "active"
      ) {
        pageQuery =
          pageQuery.eq(
            "active",
            true
          );
      } else if (
        status ===
        "inactive"
      ) {
        pageQuery =
          pageQuery.eq(
            "active",
            false
          );
      }

      const {
        data,
        error,
      } = await pageQuery;

      if (error) {
        throw error;
      }

      subscribers.push(
        ...(data ?? [])
      );
    }

    // -----------------------------------------
    // SPREADSHEET
    // -----------------------------------------

    const exportData =
      subscribers.map(
        (subscriber) => ({
          Name:
            subscriber.name,

          Company:
            subscriber.company,

          Email:
            subscriber.email,

          "Member Type":
            subscriber.member_type,

          Status:
            subscriber.active
              ? "Active"
              : "Unsubscribed",

          "Date Added":
            subscriber.created_at
              ? new Date(
                  subscriber.created_at
                ).toLocaleDateString()
              : "",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Subscribers"
    );

    const buffer =
      XLSX.write(
        workbook,
        {
          type: "buffer",
          bookType: "xlsx",
        }
      );

    const safeCompanyName =
      tenant.company.slug
        .replace(
          /[^a-z0-9-]/gi,
          "-"
        );

    return new NextResponse(
      buffer,
      {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="${safeCompanyName}-${status}-subscribers.xlsx"`,
        },
      }
    );
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