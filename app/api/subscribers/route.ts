import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const DATABASE_PAGE_SIZE = 1000;

// =========================================================
// GET COMPANY SUBSCRIBERS
// =========================================================

export async function GET(
  request: NextRequest
) {
  try {
    const companySlug =
      request.nextUrl.searchParams.get(
        "company"
      );

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const companyId =
      tenant.company.id;

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

    const subscribers: any[] = [];

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
        .select("*")
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

      if (error) {
        throw error;
      }

      subscribers.push(
        ...(data ?? [])
      );
    }

    return NextResponse.json(
      subscribers
    );
  } catch (error) {
    console.error(
      "GET SUBSCRIBERS ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const status =
      message ===
      "Authentication required."
        ? 401
        : message.includes(
            "access"
          )
        ? 403
        : 400;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      }
    );
  }
}

// =========================================================
// ADD COMPANY SUBSCRIBER
// =========================================================

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

    // -----------------------------------------
    // CLEAN INPUT
    // -----------------------------------------

    const cleanEmail =
      String(body.email ?? "")
        .normalize("NFKC")
        .replace(
          /[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\u2060\uFEFF]/g,
          ""
        )
        .replace(/\s+/g, "")
        .replace(/[.,;:]+$/g, "")
        .trim()
        .toLowerCase();

    const cleanName =
      String(body.name ?? "")
        .trim();

    const cleanSubscriberCompany =
      String(
        body.company ?? ""
      ).trim();

    const cleanMemberType =
      String(
        body.member_type ?? ""
      ).trim();

    // -----------------------------------------
    // VALIDATE
    // -----------------------------------------

    if (!cleanEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email address is required.",
        },
        {
          status: 400,
        }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        cleanEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // INSERT INTO SELECTED COMPANY
    // -----------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("subscribers")
      .insert({
        company_id:
          companyId,

        name:
          cleanName || null,

        company:
          cleanSubscriberCompany ||
          null,

        email:
          cleanEmail,

        member_type:
          cleanMemberType ||
          null,

        active: true,
      })
      .select()
      .single();

    if (error) {
      if (
        error.code === "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email address already exists for this company.",
          },
          {
            status: 400,
          }
        );
      }

      console.error(
        "INSERT SUBSCRIBER ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      subscriber: data,
      company: {
        id:
          tenant.company.id,
        name:
          tenant.company.name,
        slug:
          tenant.company.slug,
      },
    });
  } catch (error) {
    console.error(
      "POST SUBSCRIBER ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const status =
      message ===
      "Authentication required."
        ? 401
        : message.includes(
            "access"
          )
        ? 403
        : 400;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      }
    );
  }
}