import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const resend = new Resend(process.env.RESEND_API_KEY);

const WEBSITE_URL =
  process.env.WEBSITE_URL ||
  "http://localhost:3000";

const RESEND_BATCH_SIZE = 100;
const DATABASE_PAGE_SIZE = 1000;
const BATCH_DELAY_MS = 300;

type Subscriber = {
  id: number;
  name: string | null;
  email: string;
  unsubscribe_token: string;
};

type NewsletterSend = {
  subscriber_id: number;
};

type ResendBatchResult = {
  id: string;
};

type FailedBatch = {
  emails: string[];
  reason: string;
};

function delay(milliseconds: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );
}

function escapeHtml(
  value: string | null | undefined
) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createEmailHtml(
  subscriber: Subscriber,
  issue: {
    id: number;
    issue_number: string | number | null;
    title: string | null;
    month: string | null;
    year: number | null;
  },
company: {
  name: string;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  website_url: string | null;
  sender_name: string | null;
  sender_email: string | null;
}
) {
  const newsletterUrl =
    `${WEBSITE_URL}/newsletter/${issue.id}` +
    `?u=${encodeURIComponent(
      subscriber.unsubscribe_token
    )}`;

  const unsubscribeUrl =
    `${WEBSITE_URL}/unsubscribe/` +
    encodeURIComponent(
      subscriber.unsubscribe_token
    );

  const subscriberName = escapeHtml(
    subscriber.name?.trim() || "Member"
  );

  const companyName =
    escapeHtml(company.name);

  const primaryColour =
    company.primary_colour || "#1E2D5A";

  const secondaryColour =
    company.secondary_colour || "#F52B3A";

  const logoHtml = company.logo_url
    ? `<img src="${escapeHtml(company.logo_url)}" alt="${companyName}" style="display:block;max-width:180px;max-height:90px;width:auto;height:auto;margin:0 auto;" />`
    : `<div style="color:#ffffff;font-size:24px;font-weight:bold;text-align:center;">${companyName}</div>`;

  const websiteHtml = company.website_url
    ? `<p style="margin:8px 0 0 0;"><a href="${escapeHtml(company.website_url)}" style="color:${primaryColour};">${escapeHtml(company.website_url)}</a></p>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
        <div style="max-width:700px;margin:0 auto;padding:30px 15px;">
          <div style="background:#ffffff;border-radius:10px;overflow:hidden;">
            <div style="background:${primaryColour};padding:25px 30px;text-align:center;border-bottom:4px solid ${secondaryColour};">
              ${logoHtml}
            </div>
            <div style="padding:35px;line-height:1.7;">
              <h2 style="color:${primaryColour};margin:0 0 20px 0;">Hello ${subscriberName},</h2>
              <p>Thank you for your continued interest in <strong>${companyName}</strong>.</p>
              <p>We hope you enjoy this edition of our newsletter.</p>
              <div style="margin:28px 0;padding:20px;background:#f8fafc;border-left:4px solid ${secondaryColour};">
                <div style="color:${primaryColour};font-size:22px;font-weight:bold;">${escapeHtml(issue.title || "Newsletter")}</div>
                <div style="margin-top:6px;color:#64748b;font-size:14px;">
                  Issue ${escapeHtml(String(issue.issue_number ?? issue.id))}
                  ${issue.month || issue.year ? ` · ${escapeHtml([issue.month, issue.year].filter(Boolean).join(" "))}` : ""}
                </div>
              </div>
              <p>Click the button below to read your personalised newsletter.</p>
              <p style="margin:35px 0;">
                <a href="${newsletterUrl}" style="background:${secondaryColour};color:#ffffff;padding:14px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">Read Newsletter</a>
              </p>
              <hr style="margin:40px 0;border:none;border-top:1px solid #e2e8f0;" />
              <p style="font-size:13px;color:#64748b;">You are receiving this email because you are subscribed to ${companyName} updates.</p>
              <p style="font-size:13px;color:#64748b;">If you no longer wish to receive these emails, you can unsubscribe below.</p>
              <p><a href="${unsubscribeUrl}" style="color:${secondaryColour};">Unsubscribe</a></p>
              <div style="margin-top:35px;color:#475569;">
                <strong>${escapeHtml(company.sender_name || company.name)}</strong><br />
                ${companyName}
                ${websiteHtml}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function loadActiveSubscribers(
  companyId: string
) {
  const {
    count,
    error: countError,
  } = await supabase
    .from("subscribers")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("company_id", companyId)
    .eq("active", true);

  if (countError) {
    throw new Error(
      `Unable to count active subscribers: ` +
        countError.message
    );
  }

  const subscribers: Subscriber[] = [];

  for (
    let from = 0;
    from < (count ?? 0);
    from += DATABASE_PAGE_SIZE
  ) {
    const { data, error } = await supabase
      .from("subscribers")
      .select(
        "id, name, email, unsubscribe_token"
      )
      .eq("company_id", companyId)
      .eq("active", true)
      .order("id", { ascending: true })
      .range(
        from,
        from + DATABASE_PAGE_SIZE - 1
      );

    if (error) {
      throw new Error(
        `Unable to load subscribers: ${error.message}`
      );
    }

    subscribers.push(
      ...((data ?? []) as Subscriber[])
    );
  }

  return subscribers;
}

async function loadSentSubscriberIds(
  companyId: string,
  issueId: number
) {
  const sentSubscriberIds = new Set<number>();

  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("newsletter_sends")
      .select("subscriber_id")
      .eq("company_id", companyId)
      .eq("issue_id", issueId)
      .eq("status", "sent")
      .order("subscriber_id", {
        ascending: true,
      })
      .range(
        from,
        from + DATABASE_PAGE_SIZE - 1
      );

    if (error) {
      throw new Error(
        `Unable to load campaign history: ` +
          error.message
      );
    }

    const rows =
      (data ?? []) as NewsletterSend[];

    for (const row of rows) {
      sentSubscriberIds.add(
        Number(row.subscriber_id)
      );
    }

    if (rows.length < DATABASE_PAGE_SIZE) {
      break;
    }

    from += DATABASE_PAGE_SIZE;
  }

  return sentSubscriberIds;
}

export async function POST(
  request: NextRequest
) {
  try {
    const fromEmail =
      process.env.NEWSLETTER_FROM;

    const defaultReplyTo =
      process.env.NEWSLETTER_REPLY_TO;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error:
            "RESEND_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    if (!fromEmail) {
      return NextResponse.json(
        {
          error:
            "NEWSLETTER_FROM is not configured.",
        },
        { status: 500 }
      );
    }

    if (!defaultReplyTo) {
      return NextResponse.json(
        {
          error:
            "NEWSLETTER_REPLY_TO is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const companySlug =
      String(body.companySlug ?? "").trim();

    const issueId =
      Number(body.issueId);

    if (
      !companySlug ||
      !Number.isFinite(issueId)
    ) {
      return NextResponse.json(
        {
          error:
            "Company and newsletter issue are required.",
        },
        { status: 400 }
      );
    }

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
.select(
  "id,name,slug,logo_url,primary_colour,secondary_colour,website_url,sender_name,sender_email,reply_to_email"
)
      .eq("id", companyId)
      .eq("active", true)
      .maybeSingle();

    if (
      companyError ||
      !company
    ) {
      return NextResponse.json(
        {
          error:
            "Company could not be loaded.",
        },
        { status: 404 }
      );
    }

    const {
      data: latestIssue,
      error: issueError,
    } = await supabase
      .from("issues")
      .select(
        "id,company_id,issue_number,title,month,year"
      )
      .eq("id", issueId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (issueError) {
      throw issueError;
    }

    if (!latestIssue) {
      return NextResponse.json(
        {
          error:
            "This newsletter issue does not belong to the selected company.",
        },
        { status: 403 }
      );
    }

    const companyFromEmail =
  company.sender_email
    ? `${company.sender_name || company.name} <${company.sender_email}>`
    : fromEmail;

    const replyTo =
      company.reply_to_email ||
      defaultReplyTo;

    /*
     * Load all active subscribers.
     */
    const subscribers =
      await loadActiveSubscribers(companyId);

    if (subscribers.length === 0) {
      return NextResponse.json(
        {
          error: "No active subscribers.",
        },
        { status: 404 }
      );
    }

    /*
     * Load everyone already recorded as sent
     * for this particular newsletter issue.
     */
    const sentSubscriberIds =
      await loadSentSubscriberIds(companyId, issueId);

    /*
     * Only retain subscribers who have not
     * already received this issue.
     */
    const pendingSubscribers =
      subscribers.filter(
        (subscriber) =>
          !sentSubscriberIds.has(subscriber.id)
      );

    const skipped =
      subscribers.length -
      pendingSubscribers.length;

    /*
     * The campaign is already complete.
     */
    if (pendingSubscribers.length === 0) {
      return NextResponse.json({
        success: true,
        complete: true,
        message:
          "Campaign already complete. No emails were sent.",
        issueId,
        total: subscribers.length,
        pendingBeforeRun: 0,
        sent: 0,
        skipped,
        failedCount: 0,
        remaining: 0,
        failed: [],
      });
    }

    let sent = 0;
    const failed: FailedBatch[] = [];

    /*
     * Send pending subscribers in Resend
     * batches of no more than 100.
     */
    for (
      let index = 0;
      index < pendingSubscribers.length;
      index += RESEND_BATCH_SIZE
    ) {
      const subscriberBatch =
        pendingSubscribers.slice(
          index,
          index + RESEND_BATCH_SIZE
        );

      const emails = subscriberBatch.map(
        (subscriber) => ({
          from: companyFromEmail,
          replyTo,
          to: subscriber.email,
          subject:
            `${company.name} Newsletter – ` +
            `Issue ${latestIssue.issue_number}`,
          html: createEmailHtml(
            subscriber,
            latestIssue,
            company
          ),
        })
      );

      const batchNumber =
        Math.floor(
          index / RESEND_BATCH_SIZE
        ) + 1;

      const {
        data,
        error: resendError,
      } = await resend.batch.send(emails);

      if (resendError) {
        const reason =
          resendError.message ||
          "Unknown batch sending error.";

        console.error(
          `BATCH ${batchNumber} FAILED:`,
          resendError
        );

        failed.push({
          emails: subscriberBatch.map(
            (subscriber) =>
              subscriber.email
          ),
          reason,
        });

        await delay(BATCH_DELAY_MS);
        continue;
      }

      const resendResults =
        Array.isArray(data?.data)
          ? (data.data as ResendBatchResult[])
          : [];

      /*
       * A successful Resend batch should return
       * one message ID for each submitted email.
       *
       * Do not record the batch as sent when the
       * response count does not match. This avoids
       * creating unreliable tracking records.
       */
      if (
        resendResults.length !==
        subscriberBatch.length
      ) {
        const reason =
          `Resend accepted the batch but returned ` +
          `${resendResults.length} message IDs for ` +
          `${subscriberBatch.length} emails.`;

        console.error(
          `BATCH ${batchNumber} TRACKING ERROR:`,
          reason
        );

        failed.push({
          emails: subscriberBatch.map(
            (subscriber) =>
              subscriber.email
          ),
          reason,
        });

        return NextResponse.json(
          {
            success: false,
            complete: false,
            error:
              "The emails may have been accepted by Resend, " +
              "but the send history could not be matched safely. " +
              "Do not press Resume until this has been checked.",
            issueId,
            total: subscribers.length,
            pendingBeforeRun:
              pendingSubscribers.length,
            sent,
            skipped,
            failedCount:
              subscriberBatch.length,
            remaining:
              pendingSubscribers.length -
              sent,
            failed,
          },
          { status: 500 }
        );
      }

      /*
       * Match each subscriber to the corresponding
       * Resend message ID and record the entire batch.
       */
      const sendRecords =
        subscriberBatch.map(
          (subscriber, batchIndex) => ({
            company_id: companyId,
            issue_id: issueId,
            subscriber_id: subscriber.id,
            email: subscriber.email,
            sent_at:
              new Date().toISOString(),
            resend_id:
              resendResults[batchIndex]?.id ??
              null,
            status: "sent",
          })
        );

      const {
        error: trackingError,
      } = await supabase
        .from("newsletter_sends")
        .upsert(sendRecords, {
          onConflict:
            "company_id,issue_id,subscriber_id",
          ignoreDuplicates: true,
        });

      if (trackingError) {
        console.error(
          `BATCH ${batchNumber} DATABASE TRACKING ERROR:`,
          trackingError
        );

        /*
         * Resend has already accepted these emails.
         * Continuing would make it unsafe to resume,
         * because this batch has not been recorded.
         */
        return NextResponse.json(
          {
            success: false,
            complete: false,
            error:
              "Resend accepted a batch, but the database " +
              "could not record it. Do not press Resume " +
              "until the database problem has been checked.",
            details:
              trackingError.message,
            issueId,
            total: subscribers.length,
            pendingBeforeRun:
              pendingSubscribers.length,
            sent,
            skipped,
            failedCount:
              subscriberBatch.length,
            remaining:
              pendingSubscribers.length -
              sent,
            failed: [
              ...failed,
              {
                emails:
                  subscriberBatch.map(
                    (subscriber) =>
                      subscriber.email
                  ),
                reason:
                  trackingError.message,
              },
            ],
          },
          { status: 500 }
        );
      }

      sent += subscriberBatch.length;

      console.log(
        `Batch ${batchNumber} complete: ` +
          `${subscriberBatch.length} emails accepted and recorded.`
      );

      /*
       * Reduce the chance of a 429 response.
       */
      if (
        index + RESEND_BATCH_SIZE <
        pendingSubscribers.length
      ) {
        await delay(BATCH_DELAY_MS);
      }
    }

    const failedCount = failed.reduce(
      (total, batch) =>
        total + batch.emails.length,
      0
    );

    const remaining =
      pendingSubscribers.length -
      sent;

     await supabase
  .from("issues")
  .update({
    campaign_complete: remaining === 0,
  })
  .eq("id", issueId)
  .eq("company_id", companyId); 

    return NextResponse.json({
      success: failedCount === 0,
      complete: remaining === 0,
      message:
        remaining === 0
          ? "Campaign complete."
          : "Campaign paused with emails remaining.",
      issueId,
      total: subscribers.length,
      pendingBeforeRun:
        pendingSubscribers.length,
      sent,
      skipped,
      failedCount,
      remaining,
      failed,
    });
  } catch (error) {
    console.error(
      "SEND NEWSLETTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error.",
      },
      { status: 500 }
    );
  }
}
