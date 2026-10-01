import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const DATABASE_PAGE_SIZE = 1000;

type Recipient = {
  id: number;
  name: string | null;
  email: string;
};

function cleanEmailAddress(
  value: string | null | undefined
) {
  let email =
    String(value ?? "").normalize("NFKC");

  email = email.replace(
    /[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\u2060\uFEFF]/g,
    ""
  );

  email = email.replace(/\s+/g, "");

  const match =
    email.match(/<([^<>]+)>/);

  if (match?.[1]) {
    email = match[1];
  }

  return email
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

    const {
      data: company,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("id,name,slug")
      .eq("id", companyId)
      .eq("active", true)
      .maybeSingle();

    if (
      companyError ||
      !company
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Company could not be loaded.",
        },
        { status: 404 }
      );
    }

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
      )
      .eq("active", true);

    if (countError) {
      throw countError;
    }

    const recipients:
      Recipient[] = [];

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
        .select("id,name,email")
        .eq(
          "company_id",
          companyId
        )
        .eq("active", true)
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

      recipients.push(
        ...((data ?? []) as Recipient[])
      );
    }

    const uniqueRecipients =
      Array.from(
        new Map(
          recipients
            .filter(
              (recipient) =>
                cleanEmailAddress(
                  recipient.email
                )
            )
            .map(
              (recipient) => [
                cleanEmailAddress(
                  recipient.email
                ),
                recipient,
              ]
            )
        ).values()
      );

    return NextResponse.json({
      success: true,
      company: {
        name: company.name,
        slug: company.slug,
      },
      active:
        uniqueRecipients.length,
      recipients:
        uniqueRecipients.map(
          (recipient) => ({
            id: recipient.id,
            name: recipient.name,
            email:
              cleanEmailAddress(
                recipient.email
              ),
          })
        ),
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
