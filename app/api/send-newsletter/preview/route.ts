import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const DATABASE_PAGE_SIZE = 1000;

type Subscriber = {
  id: number;
  name: string | null;
  email: string;
  unsubscribe_token: string | null;
};

// =========================================================
// NEWSLETTER SEND PREVIEW
//
// IMPORTANT:
// This route DOES NOT send email.
// It only calculates and verifies the campaign audience.
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

    const issueId =
      Number(body.issueId);

    // -----------------------------------------------------
    // VERIFY USER CAN ACCESS COMPANY
    // -----------------------------------------------------

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    const companyId =
      tenant.company.id;

    // -----------------------------------------------------
    // VALIDATE ISSUE ID
    // -----------------------------------------------------

    if (
      !Number.isFinite(issueId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid newsletter issue ID.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------------------
    // VERIFY ISSUE BELONGS TO COMPANY
    // -----------------------------------------------------

    const {
      data: issue,
      error: issueError,
    } = await supabase
      .from("issues")
      .select(
        `
        id,
        company_id,
        issue_number,
        title,
        month,
        year
        `
      )
      .eq(
        "id",
        issueId
      )
      .eq(
        "company_id",
        companyId
      )
      .maybeSingle();

    if (issueError) {
      throw issueError;
    }

    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This newsletter issue does not belong to the selected company.",
        },
        {
          status: 403,
        }
      );
    }

    // -----------------------------------------------------
    // COUNT ACTIVE COMPANY SUBSCRIBERS
    // -----------------------------------------------------

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
      .eq(
        "active",
        true
      );

    if (countError) {
      throw countError;
    }

    // -----------------------------------------------------
    // LOAD ACTIVE COMPANY SUBSCRIBERS
    // -----------------------------------------------------

    const subscribers:
      Subscriber[] = [];

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
        .select(
          `
          id,
          name,
          email,
          unsubscribe_token
          `
        )
        .eq(
          "company_id",
          companyId
        )
        .eq(
          "active",
          true
        )
        .order(
          "id",
          {
            ascending: true,
          }
        )
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
        ...((data ?? []) as Subscriber[])
      );
    }

    // -----------------------------------------------------
    // LOAD ALREADY-SENT RECORDS
    //
    // Both company_id and issue_id are required.
    // -----------------------------------------------------

    const {
      data: sentRows,
      error: sentError,
    } = await supabase
      .from("newsletter_sends")
      .select(
        "subscriber_id"
      )
      .eq(
        "company_id",
        companyId
      )
      .eq(
        "issue_id",
        issueId
      )
      .eq(
        "status",
        "sent"
      );

    if (sentError) {
      throw sentError;
    }

    const sentSubscriberIds =
      new Set(
        (sentRows ?? []).map(
          (row) =>
            Number(
              row.subscriber_id
            )
        )
      );

    // -----------------------------------------------------
    // PENDING RECIPIENTS
    // -----------------------------------------------------

    const pendingSubscribers =
      subscribers.filter(
        (subscriber) =>
          !sentSubscriberIds.has(
            subscriber.id
          )
      );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return NextResponse.json({
      success: true,

      sendsEmail: false,

      company: {
        id:
          tenant.company.id,

        name:
          tenant.company.name,

        slug:
          tenant.company.slug,
      },

      issue: {
        id:
          issue.id,

        number:
          issue.issue_number,

        title:
          issue.title,

        month:
          issue.month,

        year:
          issue.year,
      },

      audience: {
        active:
          subscribers.length,

        alreadySent:
          sentSubscriberIds.size,

        pending:
          pendingSubscribers.length,
      },

      recipients:
        pendingSubscribers.map(
          (subscriber) => ({
            id:
              subscriber.id,

            name:
              subscriber.name,

            email:
              subscriber.email,
          })
        ),
    });
  } catch (error) {
    console.error(
      "NEWSLETTER PREVIEW ERROR:",
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
        : 500;

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