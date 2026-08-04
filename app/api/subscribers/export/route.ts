import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const status =
      request.nextUrl.searchParams.get("status") ?? "active";

    let query = supabase
      .from("subscribers")
      .select(
        "name, company, email, member_type, active, created_at"
      )
      .order("name", { ascending: true });

    if (status === "active") {
      query = query.eq("active", true);
    }

    if (status === "inactive") {
      query = query.eq("active", false);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const worksheet = XLSX.utils.json_to_sheet(data ?? []);

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