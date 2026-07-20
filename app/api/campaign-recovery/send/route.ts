import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { buildRecovery } from "@/lib/campaign-recovery";

console.log(
  "RESEND KEY:",
  process.env.RESEND_API_KEY?.substring(0, 12)
);

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const WEBSITE_URL =
  "https://asfp-newsletter.vercel.app";

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
  issueId: number
) {
  const newsletterUrl =
    `${WEBSITE_URL}/newsletter/${issueId}` +
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

  return `
    <div
      style="
        font-family:Arial,Helvetica,sans-serif;
        max-width:700px;
        margin:0 auto;
        color:#333;
        line-height:1.6;
        text-align:left;
      "
    >
      <div style="margin-bottom:25px;">
        <img
          src="${WEBSITE_URL}/AustraliaNewZealand-03.png"
          alt="ASFP Australia & New Zealand"
          style="max-width:70px;height:auto;display:block;"
        />
      </div>

      <h2 style="color:#1E2D5A;margin-top:0;">
        Hello ${subscriberName},
      </h2>

      <p>
        Thank you for your continued support of
        <strong>ASFP Australia & New Zealand</strong>.
      </p>

      <p>
        We hope you enjoy this edition of the
        <strong>ASFP ANZ Industry Update.</strong>
      </p>

      <p>This edition includes:</p>

      <ul>
        <li>Industry News</li>
        <li>Technical Guidance</li>
        <li>Association Updates</li>
        <li>Training Information</li>
      </ul>

      <p>
        Click the button below to read the latest newsletter.
      </p>

      <p style="margin:35px 0;">
        <a
          href="${newsletterUrl}"
          style="
            background:#1E2D5A;
            color:#ffffff;
            padding:14px 24px;
            text-decoration:none;
            border-radius:6px;
            display:inline-block;
            font-weight:bold;
          "
        >
          Read Newsletter
        </a>
      </p>

      <hr
        style="
          margin:40px 0;
          border:none;
          border-top:1px solid #ddd;
        "
      />

      <p style="font-size:14px;color:#666;">
        You are receiving this email because you have previously
        shown an interest in passive fire protection.
      </p>

      <p style="font-size:14px;color:#666;">
        If you do not wish to receive further industry updates,
        please unsubscribe and accept our apologies.
      </p>

      <p>
        <a href="${unsubscribeUrl}">
          Unsubscribe
        </a>
      </p>

      <br />

      <strong>Paul Ryan</strong><br />
      Managing Director<br />
      ASFP Australia & New Zealand<br /><br />

      Website:
      <a href="https://www.asfp.co.nz">
        www.asfp.co.nz
      </a>
    </div>
  `;
}

async function loadLatestIssue() {
  const {
    data: latestIssue,
    error: issueError,
  } = await supabase
    .from("issues")
    .select("id, issue_number")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (issueError || !latestIssue) {
    throw new Error(
      issueError?.message ||
        "No newsletter issue found."
    );
  }

  return {
    id: Number(latestIssue.id),
    issueNumber: latestIssue.issue_number,
  };
}

async function loadSentSubscriberIds(
  issueId: number
) {
  const sentSubscriberIds = new Set<number>();

  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("newsletter_sends")
      .select("subscriber_id")
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

/*
 * GET is a safe preview.
 *
 * Visiting the URL in the browser does not
 * send any emails.
 */
export async function GET() {
  try {
    const recovery = await buildRecovery();

    const latestIssue =
      await loadLatestIssue();

    const sentSubscriberIds =
      await loadSentSubscriberIds(
        latestIssue.id
      );

    const subscribers =
      recovery.subscribers as Subscriber[];

    const readyToSend =
      subscribers.filter(
        (subscriber) =>
          !sentSubscriberIds.has(
            Number(subscriber.id)
          )
      );

    const alreadySent =
      subscribers.length -
      readyToSend.length;

    return NextResponse.json({
      success: true,
      previewOnly: true,
      issueId: latestIssue.id,
      issueNumber:
        latestIssue.issueNumber,
      found: subscribers.length,
      alreadySent,
      readyToSend: readyToSend.length,
      summary: recovery.summary,
    });
  } catch (error) {
    console.error(
      "RECOVERY PREVIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST performs the recovery send.
 */
export async function POST() {
  try {
    const fromEmail =
      process.env.NEWSLETTER_FROM;

    const replyTo =
      process.env.NEWSLETTER_REPLY_TO;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "RESEND_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    if (!fromEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "NEWSLETTER_FROM is not configured.",
        },
        { status: 500 }
      );
    }

    if (!replyTo) {
      return NextResponse.json(
        {
          success: false,
          error:
            "NEWSLETTER_REPLY_TO is not configured.",
        },
        { status: 500 }
      );
    }

    /*
     * Recover only the matched subscribers
     * identified by campaign recovery.
     */
    const recovery = await buildRecovery();

    const subscribers =
      recovery.subscribers as Subscriber[];

    const latestIssue =
      await loadLatestIssue();

    const issueId = latestIssue.id;

    /*
     * Do not resend to anyone already recorded
     * as sent for this issue.
     */
    const sentSubscriberIds =
      await loadSentSubscriberIds(issueId);

    const pendingSubscribers =
      subscribers.filter(
        (subscriber) =>
          !sentSubscriberIds.has(
            Number(subscriber.id)
          )
      );

    const skipped =
      subscribers.length -
      pendingSubscribers.length;

    if (pendingSubscribers.length === 0) {
      return NextResponse.json({
        success: true,
        complete: true,
        message:
          "Recovery campaign already complete. No emails were sent.",
        issueId,
        issueNumber:
          latestIssue.issueNumber,
        found: subscribers.length,
        skipped,
        sent: 0,
        failed: 0,
        remaining: 0,
      });
    }

    let sent = 0;

    const failedBatches: FailedBatch[] =
      [];

    /*
     * Resend permits up to 100 emails in
     * each batch request.
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
          from: fromEmail,
          replyTo,
          to: subscriber.email,
          subject:
            `ASFP ANZ Industry Update – ` +
            `Issue ${latestIssue.issueNumber}`,
          html: createEmailHtml(
            subscriber,
            issueId
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
          `RECOVERY BATCH ${batchNumber} FAILED:`,
          resendError
        );

        failedBatches.push({
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
       * Do not create tracking records unless
       * every submitted email has a Resend ID.
       */
      if (
        resendResults.length !==
        subscriberBatch.length
      ) {
        const reason =
          `Resend returned ` +
          `${resendResults.length} message IDs for ` +
          `${subscriberBatch.length} recovery emails.`;

        console.error(
          `RECOVERY BATCH ${batchNumber} TRACKING ERROR:`,
          reason
        );

        return NextResponse.json(
          {
            success: false,
            complete: false,
            error:
              "The recovery emails may have been accepted by Resend, but their send history could not be matched safely. Do not press Send Recovery again until this has been checked.",
            issueId,
            found: subscribers.length,
            skipped,
            sent,
            failed:
              subscriberBatch.length,
            remaining:
              pendingSubscribers.length -
              sent,
            details: reason,
          },
          { status: 500 }
        );
      }

      const sentAt =
        new Date().toISOString();

      const sendRecords =
        subscriberBatch.map(
          (subscriber, batchIndex) => ({
            issue_id: issueId,
            subscriber_id:
              Number(subscriber.id),
            email: subscriber.email,
            sent_at: sentAt,
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
            "issue_id,subscriber_id",
          ignoreDuplicates: true,
        });

      if (trackingError) {
        console.error(
          `RECOVERY BATCH ${batchNumber} DATABASE ERROR:`,
          trackingError
        );

        return NextResponse.json(
          {
            success: false,
            complete: false,
            error:
              "Resend accepted a recovery batch, but the database could not record it. Do not press Send Recovery again until this has been checked.",
            details:
              trackingError.message,
            issueId,
            found: subscribers.length,
            skipped,
            sent,
            failed:
              subscriberBatch.length,
            remaining:
              pendingSubscribers.length -
              sent,
          },
          { status: 500 }
        );
      }

      sent += subscriberBatch.length;

      console.log(
        `Recovery batch ${batchNumber} complete: ` +
          `${subscriberBatch.length} emails accepted and recorded.`
      );

      if (
        index + RESEND_BATCH_SIZE <
        pendingSubscribers.length
      ) {
        await delay(BATCH_DELAY_MS);
      }
    }

    const failed = failedBatches.reduce(
      (total, batch) =>
        total + batch.emails.length,
      0
    );

    const remaining =
      pendingSubscribers.length -
      sent;

    return NextResponse.json({
      success: failed === 0,
      complete: remaining === 0,
      message:
        remaining === 0
          ? "Recovery campaign complete."
          : "Recovery campaign finished with emails remaining.",
      issueId,
      issueNumber:
        latestIssue.issueNumber,
      found: subscribers.length,
      skipped,
      sent,
      failed,
      remaining,
      failedBatches,
      summary: recovery.summary,
    });
  } catch (error) {
    console.error(
      "RECOVERY SEND ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error.",
      },
      { status: 500 }
    );
  }
}