import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const WEBSITE_URL =
  process.env.WEBSITE_URL ||
  "https://asfp-newsletter.vercel.app";

const RESEND_BATCH_SIZE = 25;
const DATABASE_PAGE_SIZE = 1000;
const BATCH_DELAY_MS = 1000;

type Subscriber = {
  id: number;
  name: string | null;
  email: string;
  unsubscribe_token: string;
};

type ResendBatchResult = {
  id: string;
};

type CampaignContent = {
  subject: string;
  heading: string;
  content: string;
  buttonText: string;
  buttonLink: string;
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

function createEmailHtml({
  subscriber,
  heading,
  content,
  buttonText,
  buttonLink,
}: {
  subscriber: Subscriber;
  heading?: string;
  content: string;
  buttonText?: string;
  buttonLink?: string;
}) {
  const unsubscribeUrl =
    `${WEBSITE_URL}/unsubscribe/` +
    encodeURIComponent(
      subscriber.unsubscribe_token
    );

  const subscriberName =
    escapeHtml(
      subscriber.name?.trim() || ""
    );

  const greeting =
    subscriberName
      ? `Hello ${subscriberName},`
      : "Hello,";

  const paragraphs = String(content)
    .split(/\n\s*\n/)
    .filter((paragraph) =>
      paragraph.trim()
    )
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px 0;line-height:1.7;">${escapeHtml(
          paragraph.trim()
        ).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <body style="
        margin:0;
        padding:0;
        background:#f1f5f9;
        font-family:Arial,Helvetica,sans-serif;
        color:#1e293b;
      ">

        <div style="
          max-width:700px;
          margin:0 auto;
          padding:30px 15px;
        ">

          <div style="
            background:#ffffff;
            border-radius:10px;
            overflow:hidden;
          ">

            <div style="
              background:#1E2D5A;
              padding:18px 30px;
              text-align:center;
              border-bottom:4px solid #F52B3A;
            ">

              <img
                src="${WEBSITE_URL}/AustraliaNewZealand-02.png"
                alt="ASFP Australia & New Zealand"
                width="140"
                style="
                  display:block;
                  width:140px;
                  max-width:100%;
                  height:auto;
                  margin:0 auto;
                "
              />

            </div>

            <div style="padding:35px;">

              <p style="
                margin:0 0 24px 0;
                font-size:16px;
              ">
                ${greeting}
              </p>

              ${
                heading
                  ? `
                    <h1 style="
                      color:#1E2D5A;
                      font-size:28px;
                      margin:0 0 25px 0;
                    ">
                      ${escapeHtml(heading)}
                    </h1>
                  `
                  : ""
              }

              <div style="
                font-size:16px;
                line-height:1.7;
              ">
                ${paragraphs}
              </div>

              ${
                buttonText && buttonLink
                  ? `
                    <div style="
                      margin-top:30px;
                      margin-bottom:20px;
                    ">
                      <a
                        href="${escapeHtml(buttonLink)}"
                        style="
                          background:#F52B3A;
                          color:#ffffff;
                          padding:14px 24px;
                          text-decoration:none;
                          border-radius:6px;
                          display:inline-block;
                          font-weight:bold;
                        "
                      >
                        ${escapeHtml(buttonText)}
                      </a>
                    </div>
                  `
                  : ""
              }

            </div>

            <div style="
              border-top:1px solid #e2e8f0;
              padding:25px 35px;
              font-size:12px;
              color:#64748b;
            ">

              <p>
                You are receiving this email because you are
                subscribed to ASFP Australia & New Zealand
                industry updates.
              </p>

              <p>
                <a
                  href="${unsubscribeUrl}"
                  style="color:#64748b;"
                >
                  Unsubscribe
                </a>
              </p>

            </div>

          </div>

        </div>

      </body>
    </html>
  `;
}

// -----------------------------------------
// LOAD ACTIVE SUBSCRIBERS
// -----------------------------------------

async function loadActiveSubscribers() {
  const {
    count,
    error: countError,
  } = await supabase
    .from("subscribers")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("active", true);

  if (countError) {
    throw new Error(
      countError.message
    );
  }

  const subscribers: Subscriber[] = [];

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
        "id,name,email,unsubscribe_token"
      )
      .eq("active", true)

      /*
       * Order by ID so duplicate-email
       * selection is deterministic between
       * the original send and any resume.
       */
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
      throw new Error(
        error.message
      );
    }

    subscribers.push(
      ...((data ?? []) as Subscriber[])
    );
  }

  /*
   * One email address receives one copy.
   *
   * Map.set() replaces an earlier duplicate,
   * so with ascending ID ordering the highest
   * subscriber ID for an email is retained.
   * Most importantly, this is deterministic
   * on every run/resume.
   */
  return Array.from(
    new Map(
      subscribers
        .filter(
          (subscriber) =>
            subscriber.email?.trim()
        )
        .map((subscriber) => [
          subscriber.email
            .trim()
            .toLowerCase(),
          subscriber,
        ])
    ).values()
  );
}

// -----------------------------------------
// LOAD ALREADY SENT
// -----------------------------------------

async function loadAlreadySent(
  campaignId: number
) {
  const sentSubscriberIds =
    new Set<number>();

  let from = 0;

  while (true) {
    const {
      data,
      error,
    } = await supabase
      .from("announcement_sends")
      .select("subscriber_id")
      .eq(
        "campaign_id",
        campaignId
      )
      .eq("status", "sent")
      .order("subscriber_id", {
        ascending: true,
      })
      .range(
        from,
        from +
          DATABASE_PAGE_SIZE -
          1
      );

    if (error) {
      throw new Error(
        error.message
      );
    }

    const rows = data ?? [];

    for (const row of rows) {
      sentSubscriberIds.add(
        Number(row.subscriber_id)
      );
    }

    if (
      rows.length <
      DATABASE_PAGE_SIZE
    ) {
      break;
    }

    from += DATABASE_PAGE_SIZE;
  }

  return sentSubscriberIds;
}

// -----------------------------------------
// LOAD STORED CAMPAIGN
// -----------------------------------------

async function loadCampaign(
  campaignId: number
) {
  const {
    data,
    error,
  } = await supabase
    .from("announcement_campaigns")
    .select(
      `
      id,
      subject,
      heading,
      content,
      button_text,
      button_link,
      status
      `
    )
    .eq("id", campaignId)
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ||
        `Campaign #${campaignId} could not be found.`
    );
  }

  return data;
}

// -----------------------------------------
// POST
// -----------------------------------------

export async function POST(
  request: NextRequest
) {
  try {
    if (
      !process.env.RESEND_API_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "RESEND_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const fromEmail =
      process.env.NEWSLETTER_FROM;

    const replyTo =
      process.env.NEWSLETTER_REPLY_TO;

    if (!fromEmail || !replyTo) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Newsletter email settings are not configured.",
        },
        { status: 500 }
      );
    }

    const body =
      await request.json();

    const {
      subject,
      heading,
      content,
      buttonText,
      buttonLink,
      proofEmail,
      sendToAll,
      campaignId,
    } = body;

    // -----------------------------------------
    // PROOF EMAIL
    // -----------------------------------------

    if (!sendToAll) {
      if (
        !subject ||
        !content
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Subject and email content are required.",
          },
          { status: 400 }
        );
      }

      if (!proofEmail) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Proof email address is required.",
          },
          { status: 400 }
        );
      }

const cleanProofEmail = proofEmail
  .trim()
  .toLowerCase();

const {
  data: subscribers,
  error,
} = await supabase
  .from("subscribers")
  .select(
    "id,name,email,unsubscribe_token,active"
  )
  .ilike(
    "email",
    cleanProofEmail
  );

if (error) {
  console.error(
    "PROOF SUBSCRIBER LOOKUP ERROR:",
    error
  );

  return NextResponse.json(
    {
      success: false,
      error:
        `Subscriber lookup failed: ${error.message}`,
    },
    { status: 500 }
  );
}

if (!subscribers || subscribers.length === 0) {
  return NextResponse.json(
    {
      success: false,
      error:
        `No subscriber found for ${cleanProofEmail}.`,
    },
    { status: 404 }
  );
}

if (subscribers.length > 1) {
  return NextResponse.json(
    {
      success: false,
      error:
        `More than one subscriber record exists for ${cleanProofEmail}. Please remove the duplicate.`,
    },
    { status: 409 }
  );
}

const subscriber = subscribers[0];

      const html =
        createEmailHtml({
          subscriber,
          heading,
          content,
          buttonText,
          buttonLink,
        });

      const {
        data,
        error: resendError,
      } =
        await resend.emails.send({
          from: fromEmail,
          replyTo,
          to: subscriber.email,
          subject,
          html,
        });

      if (resendError) {
        return NextResponse.json(
          {
            success: false,
            error:
              resendError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        proof: true,
        sent: 1,
        resendId:
          data?.id ?? null,
      });
    }

    // -----------------------------------------
    // CREATE OR RESUME CAMPAIGN
    // -----------------------------------------

    let currentCampaignId: number;

    let campaignContent: CampaignContent;

    if (campaignId) {
      // ---------------------------------------
      // RESUME EXISTING CAMPAIGN
      // ---------------------------------------

      currentCampaignId =
        Number(campaignId);

      if (
        !Number.isFinite(
          currentCampaignId
        ) ||
        currentCampaignId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid campaign ID.",
          },
          { status: 400 }
        );
      }

      /*
       * IMPORTANT:
       *
       * Do not trust the browser's subject,
       * content or button values when
       * resuming.
       *
       * The remaining recipients must
       * receive the exact campaign stored
       * when the original send started.
       */
      const storedCampaign =
        await loadCampaign(
          currentCampaignId
        );

      if (
        storedCampaign.status ===
        "completed"
      ) {
        return NextResponse.json(
          {
            success: true,
            complete: true,
            campaignId:
              currentCampaignId,
            message:
              "This campaign is already completed.",
            sent: 0,
            failed: 0,
            remaining: 0,
          }
        );
      }

      campaignContent = {
        subject:
          String(
            storedCampaign.subject ??
              ""
          ),
        heading:
          String(
            storedCampaign.heading ??
              ""
          ),
        content:
          String(
            storedCampaign.content ??
              ""
          ),
        buttonText:
          String(
            storedCampaign.button_text ??
              ""
          ),
        buttonLink:
          String(
            storedCampaign.button_link ??
              ""
          ),
      };

      if (
        !campaignContent.subject ||
        !campaignContent.content
      ) {
        throw new Error(
          `Campaign #${currentCampaignId} does not contain valid email content.`
        );
      }

      /*
       * Mark it as sending again while
       * the recovery attempt is running.
       */
      const {
        error: resumeStatusError,
      } = await supabase
        .from(
          "announcement_campaigns"
        )
        .update({
          status: "sending",
        })
        .eq(
          "id",
          currentCampaignId
        );

      if (resumeStatusError) {
        throw new Error(
          resumeStatusError.message
        );
      }
    } else {
      // ---------------------------------------
      // CREATE NEW CAMPAIGN
      // ---------------------------------------

      if (
        !subject ||
        !content
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Subject and email content are required.",
          },
          { status: 400 }
        );
      }

      campaignContent = {
        subject:
          String(subject),
        heading:
          String(heading ?? ""),
        content:
          String(content),
        buttonText:
          String(buttonText ?? ""),
        buttonLink:
          String(buttonLink ?? ""),
      };

      const {
        data: campaign,
        error:
          campaignCreateError,
      } = await supabase
        .from(
          "announcement_campaigns"
        )
        .insert({
          subject:
            campaignContent.subject,
          heading:
            campaignContent.heading ||
            null,
          content:
            campaignContent.content,
          button_text:
            campaignContent.buttonText ||
            null,
          button_link:
            campaignContent.buttonLink ||
            null,
          status:
            "sending",
          started_at:
            new Date().toISOString(),
        })
        .select("id")
        .single();

      if (
        campaignCreateError ||
        !campaign
      ) {
        throw new Error(
          campaignCreateError
            ?.message ||
            "Unable to create campaign."
        );
      }

      currentCampaignId =
        Number(campaign.id);
    }

    // -----------------------------------------
    // LOAD SUBSCRIBERS
    // -----------------------------------------

    const subscribers =
      await loadActiveSubscribers();

    const alreadySent =
      await loadAlreadySent(
        currentCampaignId
      );

    const pendingSubscribers =
      subscribers.filter(
        (subscriber) =>
          !alreadySent.has(
            Number(subscriber.id)
          )
      );

    const skipped =
      subscribers.length -
      pendingSubscribers.length;

    // -----------------------------------------
    // NOTHING LEFT TO SEND
    // -----------------------------------------

    if (
      pendingSubscribers.length ===
      0
    ) {
      const {
        error: completeError,
      } = await supabase
        .from(
          "announcement_campaigns"
        )
        .update({
          status:
            "completed",
          completed_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          currentCampaignId
        );

      if (completeError) {
        throw new Error(
          completeError.message
        );
      }

      return NextResponse.json({
        success: true,
        complete: true,
        campaignId:
          currentCampaignId,
        totalSubscribers:
          subscribers.length,
        alreadySent:
          skipped,
        sent: 0,
        failed: 0,
        remaining: 0,
      });
    }

    let sent = 0;
    let failed = 0;

    const failedBatches: Array<{
      emails: string[];
      reason: string;
    }> = [];

    // -----------------------------------------
    // SEND IN RESEND BATCHES
    // -----------------------------------------

    for (
      let index = 0;
      index <
      pendingSubscribers.length;
      index +=
        RESEND_BATCH_SIZE
    ) {
      const subscriberBatch =
        pendingSubscribers.slice(
          index,
          index +
            RESEND_BATCH_SIZE
        );

      const emails =
        subscriberBatch.map(
          (subscriber) => ({
            from: fromEmail,
            replyTo,
            to: subscriber.email,

            /*
             * Always use the content belonging
             * to the stored campaign.
             */
            subject:
              campaignContent.subject,

            html:
              createEmailHtml({
                subscriber,
                heading:
                  campaignContent.heading,
                content:
                  campaignContent.content,
                buttonText:
                  campaignContent.buttonText,
                buttonLink:
                  campaignContent.buttonLink,
              }),
          })
        );

      const {
        data,
        error: resendError,
      } =
        await resend.batch.send(
          emails
        );

      if (resendError) {
        console.error(
  "RESEND BATCH ERROR:",
  resendError
);
        failed +=
          subscriberBatch.length;

        failedBatches.push({
          emails:
            subscriberBatch.map(
              (subscriber) =>
                subscriber.email
            ),
          reason:
            resendError.message ||
            "Unknown Resend error.",
        });

        await delay(
          BATCH_DELAY_MS
        );

        continue;
      }

      const resendResults =
        Array.isArray(
          data?.data
        )
          ? (data.data as ResendBatchResult[])
          : [];

      if (
        resendResults.length !==
        subscriberBatch.length
      ) {
        /*
         * We do not know which messages
         * Resend accepted, so stop.
         *
         * Do not automatically retry this
         * batch.
         */
        await supabase
          .from(
            "announcement_campaigns"
          )
          .update({
            status: "partial",
          })
          .eq(
            "id",
            currentCampaignId
          );

        return NextResponse.json(
          {
            success: false,
            complete: false,
            campaignId:
              currentCampaignId,
            error:
              "Resend accepted a batch but the returned message IDs could not be matched safely. Do not resend until checked.",
            sent,
            failed,
            remaining:
              pendingSubscribers.length -
              sent,
          },
          { status: 500 }
        );
      }

      const sentAt =
        new Date().toISOString();

      const records =
        subscriberBatch.map(
          (
            subscriber,
            batchIndex
          ) => ({
            campaign_id:
              currentCampaignId,
            subscriber_id:
              Number(
                subscriber.id
              ),
            email:
              subscriber.email
                .trim()
                .toLowerCase(),
            resend_id:
              resendResults[
                batchIndex
              ]?.id ?? null,
            status: "sent",
            error: null,
            sent_at: sentAt,
          })
        );

      const {
        error:
          trackingError,
      } = await supabase
        .from(
          "announcement_sends"
        )
        .upsert(records, {
          onConflict:
            "campaign_id,subscriber_id",
        });

      if (trackingError) {
        /*
         * Resend has already accepted these
         * emails. We MUST stop because
         * retrying could duplicate them.
         */
        await supabase
          .from(
            "announcement_campaigns"
          )
          .update({
            status: "partial",
          })
          .eq(
            "id",
            currentCampaignId
          );

        return NextResponse.json(
          {
            success: false,
            complete: false,
            campaignId:
              currentCampaignId,
            error:
              "Resend accepted a batch, but its send history could not be saved. Do not resend until this is checked.",
            details:
              trackingError.message,
            sent,
            failed,
            remaining:
              pendingSubscribers.length -
              sent,
          },
          { status: 500 }
        );
      }

      sent +=
        subscriberBatch.length;

      if (
        index +
          RESEND_BATCH_SIZE <
        pendingSubscribers.length
      ) {
        await delay(
          BATCH_DELAY_MS
        );
      }
    }

    // -----------------------------------------
    // FINAL STATUS
    // -----------------------------------------

    const remaining =
      pendingSubscribers.length -
      sent;

    const complete =
      remaining === 0;

    const {
      error: finalStatusError,
    } = await supabase
      .from(
        "announcement_campaigns"
      )
      .update({
        status: complete
          ? "completed"
          : "partial",
        completed_at:
          complete
            ? new Date().toISOString()
            : null,
      })
      .eq(
        "id",
        currentCampaignId
      );

    if (finalStatusError) {
      throw new Error(
        finalStatusError.message
      );
    }

    return NextResponse.json({
      success:
        failed === 0 &&
        complete,
      complete,
      campaignId:
        currentCampaignId,
      totalSubscribers:
        subscribers.length,
      alreadySent:
        skipped,
      sent,
      failed,
      remaining,
      failedBatches,
    });
  } catch (error) {
    console.error(
      "ANNOUNCEMENT ERROR:",
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