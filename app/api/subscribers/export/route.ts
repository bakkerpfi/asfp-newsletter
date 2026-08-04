import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const status =
      request.nextUrl.searchParams.get("status") ?? "active";

    // Count matching subscribers
    let countQuery = supabase
      .from("subscribers")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (status === "active") {
      countQuery = countQuery.eq("active", true);
    } else if (status === "inactive") {
      countQuery = countQuery.eq("active", false);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    const pageSize = 1000;
    let subscribers: any[] = [];

    // Load all matching subscribers in batches
    for (let from = 0; from < (count ?? 0); from += pageSize) {
      let pageQuery = supabase
        .from("subscribers")
        .select(
          "name, company, email, member_type, active, created_at"
        )
        .order("name", { ascending: true })
        .range(from, from + pageSize - 1);

      if (status === "active") {
        pageQuery = pageQuery.eq("active", true);
      } else if (status === "inactive") {
        pageQuery = pageQuery.eq("active", false);
      }

      const { data, error } = await pageQuery;

      if (error) {
        throw error;
      }

      subscribers.push(...(data ?? []));
    }

    console.log(`Exporting ${subscribers.length} subscribers`);

    // Make the spreadsheet headings user-friendly
    const exportData = subscribers.map((s) => ({
      Name: s.name,
      Company: s.company,
      Email: s.email,
      "Member Type": s.member_type,
      Status: s.active ? "Active" : "Unsubscribed",
      "Date Added": s.created_at
        ? new Date(s.created_at).toLocaleDateString()
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Subscribers"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="ASFP-${status}-subscribers.xlsx"`,
      },
    });

  } catch (error) {
    console.error("EXPORT ERROR:", error);

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