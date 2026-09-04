import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const WEBSITE_URL =
  process.env.WEBSITE_URL ||
  "https://asfp-newsletter.vercel.app";

// Sending controls
const RESEND_BATCH_SIZE = 10;
const DATABASE_PAGE_SIZE = 1000;
const BATCH_DELAY_MS = 1500;
const MAX_BATCH_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

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

type FailedBatch = {
  emails: string[];
  reason: string;
};

// -----------------------------------------
// HELPERS
// -----------------------------------------

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

// -----------------------------------------
// CLEAN EMAIL ADDRESS
// -----------------------------------------

function cleanEmailAddress(
  value: string | null | undefined
) {
  let email = String(value ?? "");

  /*
   * NFKC converts common full-width Unicode
   * characters to their normal ASCII equivalents.
   *
   * Example:
   * ＠ becomes @
   */
  email = email.normalize("NFKC");

  /*
   * Remove invisible/control characters:
   *
   * - non-breaking spaces
   * - zero-width spaces
   * - byte-order marks
   * - other control characters commonly introduced
   *   when copying data from Excel/PDF/web pages.
   */
  email = email.replace(
    /[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\u2060\uFEFF]/g,
    ""
  );

  /*
   * Remove normal whitespace anywhere in the email.
   */
  email = email.replace(/\s+/g, "");

  /*
   * If an address has accidentally been stored as:
   *
   * Name <person@example.com>
   *
   * extract the actual address.
   */
  const angleBracketMatch =
    email.match(/<([^<>]+)>/);

  if (angleBracketMatch?.[1]) {
    email = angleBracketMatch[1];
  }

  /*
   * Remove common punctuation accidentally pasted
   * onto the very end of an address.
   *
   * Example:
   * shane@wingates.co.nz.
   *
   * becomes:
   * shane@wingates.co.nz
   */
  email = email.replace(/[.,;:]+$/g, "");

  return email
    .trim()
    .toLowerCase();
}

// -----------------------------------------
// VALIDATE EMAIL
// -----------------------------------------

function isValidEmailAddress(
  email: string
) {
  if (!email) {
    return false;
  }

  /*
   * Resend currently expects normal ASCII email
   * addresses in the recipient field.
   */
  if (!/^[\x00-\x7F]+$/.test(email)) {
    return false;
  }

  if (
    email.length > 254 ||
    email.startsWith("@") ||
    email.endsWith("@")
  ) {
    return false;
  }

  const parts =
    email.split("@");

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] =
    parts;

  if (
    !localPart ||
    !domain ||
    localPart.length > 64
  ) {
    return false;
  }

  /*
   * Practical validation for our newsletter list.
   * This deliberately requires a normal domain with
   * at least one dot.
   */
  const pattern =
    /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

  return pattern.test(email);
}

// -----------------------------------------
// CREATE EMAIL HTML
// -----------------------------------------

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
                buttonText &&
                buttonLink
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
// RECORD FAILED SUBSCRIBERS
// -----------------------------------------

async function recordFailedSubscribers({
  campaignId,
  subscribers,
  reason,
}: {
  campaignId: number;
  subscribers: Subscriber[];
  reason: string;
}) {
  if (
    subscribers.length === 0
  ) {
    return;
  }

  const records =
    subscribers.map(
      (subscriber) => ({
        campaign_id:
          campaignId,

        subscriber_id:
          Number(
            subscriber.id
          ),

        email:
          cleanEmailAddress(
            subscriber.email
          ) ||
          String(
            subscriber.email ?? ""
          )
            .trim()
            .toLowerCase(),

        resend_id: null,

        status: "failed",

        error: reason,

        sent_at: null,
      })
    );

  const {
    error,
  } = await supabase
    .from(
      "announcement_sends"
    )
    .upsert(
      records,
      {
        onConflict:
          "campaign_id,subscriber_id",
      }
    );

  if (error) {
    console.error(
      "FAILED SEND TRACKING ERROR:",
      error
    );
  }
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
        "id,name,email,unsubscribe_token"
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
      throw new Error(
        error.message
      );
    }

    subscribers.push(
      ...((data ?? []) as Subscriber[])
    );
  }

  /*
   * Deduplicate using the cleaned email address.
   *
   * This also means an address containing an invisible
   * character will be treated as the same address as
   * its clean version.
   */
  return Array.from(
    new Map(
      subscribers
        .filter(
          (subscriber) =>
            cleanEmailAddress(
              subscriber.email
            )
        )
        .map(
          (subscriber) => [
            cleanEmailAddress(
              subscriber.email
            ),
            subscriber,
          ]
        )
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
      .from(
        "announcement_sends"
      )
      .select(
        "subscriber_id"
      )
      .eq(
        "campaign_id",
        campaignId
      )
      .eq(
        "status",
        "sent"
      )
      .order(
        "subscriber_id",
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
      throw new Error(
        error.message
      );
    }

    const rows =
      data ?? [];

    for (
      const row of rows
    ) {
      sentSubscriberIds.add(
        Number(
          row.subscriber_id
        )
      );
    }

    if (
      rows.length <
      DATABASE_PAGE_SIZE
    ) {
      break;
    }

    from +=
      DATABASE_PAGE_SIZE;
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
    .from(
      "announcement_campaigns"
    )
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
    .eq(
      "id",
      campaignId
    )
    .single();

  if (
    error ||
    !data
  ) {
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
      !process.env
        .RESEND_API_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "RESEND_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const fromEmail =
      process.env
        .NEWSLETTER_FROM;

    const replyTo =
      process.env
        .NEWSLETTER_REPLY_TO;

    if (
      !fromEmail ||
      !replyTo
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Newsletter email settings are not configured.",
        },
        {
          status: 500,
        }
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
          {
            status: 400,
          }
        );
      }

      if (
        !proofEmail
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Proof email address is required.",
          },
          {
            status: 400,
          }
        );
      }

      const cleanProofEmail =
        cleanEmailAddress(
          proofEmail
        );

      if (
        !isValidEmailAddress(
          cleanProofEmail
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The proof email address is not valid.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Load subscribers and compare their cleaned
       * address rather than relying on a raw database
       * string comparison.
       */
      const {
        data: proofSubscribers,
        error:
          proofLookupError,
      } = await supabase
        .from("subscribers")
        .select(
          "id,name,email,unsubscribe_token,active"
        );

      if (
        proofLookupError
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Subscriber lookup failed: ${proofLookupError.message}`,
          },
          {
            status: 500,
          }
        );
      }

      const matches =
        (
          proofSubscribers ??
          []
        ).filter(
          (subscriber) =>
            cleanEmailAddress(
              subscriber.email
            ) ===
            cleanProofEmail
        );

      if (
        matches.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `No subscriber found for ${cleanProofEmail}.`,
          },
          {
            status: 404,
          }
        );
      }

      if (
        matches.length > 1
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `More than one subscriber record exists for ${cleanProofEmail}. Please remove the duplicate.`,
          },
          {
            status: 409,
          }
        );
      }

      const subscriber =
        matches[0] as Subscriber;

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
        error:
          resendError,
      } =
        await resend.emails.send({
          from:
            fromEmail,

          replyTo,

          to:
            cleanProofEmail,

          subject,

          html,
        });

      if (
        resendError
      ) {
        console.error(
          "PROOF RESEND ERROR:",
          resendError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              resendError.message,
          },
          {
            status: 500,
          }
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

    let currentCampaignId:
      number;

    let campaignContent:
      CampaignContent;

    if (campaignId) {
      currentCampaignId =
        Number(
          campaignId
        );

      if (
        !Number.isFinite(
          currentCampaignId
        ) ||
        currentCampaignId <=
          0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid campaign ID.",
          },
          {
            status: 400,
          }
        );
      }

      const storedCampaign =
        await loadCampaign(
          currentCampaignId
        );

      if (
        storedCampaign
          .status ===
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
            storedCampaign
              .subject ??
              ""
          ),

        heading:
          String(
            storedCampaign
              .heading ??
              ""
          ),

        content:
          String(
            storedCampaign
              .content ??
              ""
          ),

        buttonText:
          String(
            storedCampaign
              .button_text ??
              ""
          ),

        buttonLink:
          String(
            storedCampaign
              .button_link ??
              ""
          ),
      };

      if (
        !campaignContent
          .subject ||
        !campaignContent
          .content
      ) {
        throw new Error(
          `Campaign #${currentCampaignId} does not contain valid email content.`
        );
      }

      const {
        error:
          resumeStatusError,
      } = await supabase
        .from(
          "announcement_campaigns"
        )
        .update({
          status:
            "sending",
        })
        .eq(
          "id",
          currentCampaignId
        );

      if (
        resumeStatusError
      ) {
        throw new Error(
          resumeStatusError
            .message
        );
      }
    } else {
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
          {
            status: 400,
          }
        );
      }

      campaignContent = {
        subject:
          String(subject),

        heading:
          String(
            heading ?? ""
          ),

        content:
          String(content),

        buttonText:
          String(
            buttonText ?? ""
          ),

        buttonLink:
          String(
            buttonLink ?? ""
          ),
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
            campaignContent
              .subject,

          heading:
            campaignContent
              .heading ||
            null,

          content:
            campaignContent
              .content,

          button_text:
            campaignContent
              .buttonText ||
            null,

          button_link:
            campaignContent
              .buttonLink ||
            null,

          status:
            "sending",

          started_at:
            new Date()
              .toISOString(),
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
        Number(
          campaign.id
        );
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
            Number(
              subscriber.id
            )
          )
      );

    const skipped =
      subscribers.length -
      pendingSubscribers.length;

    // -----------------------------------------
    // NOTHING LEFT
    // -----------------------------------------

    if (
      pendingSubscribers.length ===
      0
    ) {
      const {
        error:
          completeError,
      } = await supabase
        .from(
          "announcement_campaigns"
        )
        .update({
          status:
            "completed",

          completed_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          currentCampaignId
        );

      if (
        completeError
      ) {
        throw new Error(
          completeError
            .message
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

    const failedBatches:
      FailedBatch[] = [];

    // -----------------------------------------
    // PROCESS EACH BATCH
    // -----------------------------------------

    for (
      let index = 0;
      index <
      pendingSubscribers.length;
      index +=
        RESEND_BATCH_SIZE
    ) {
      const rawBatch =
        pendingSubscribers.slice(
          index,
          index +
            RESEND_BATCH_SIZE
        );

      /*
       * Clean and validate every recipient BEFORE
       * building the Resend batch.
       */
      const preparedBatch =
        rawBatch.map(
          (subscriber) => ({
            subscriber,
            originalEmail:
              subscriber.email,
            cleanEmail:
              cleanEmailAddress(
                subscriber.email
              ),
          })
        );

      const invalidItems =
        preparedBatch.filter(
          (item) =>
            !isValidEmailAddress(
              item.cleanEmail
            )
        );

      const validItems =
        preparedBatch.filter(
          (item) =>
            isValidEmailAddress(
              item.cleanEmail
            )
        );

      // ---------------------------------------
      // INVALID EMAILS
      // ---------------------------------------

      if (
        invalidItems.length >
        0
      ) {
        const invalidSubscribers =
          invalidItems.map(
            (item) =>
              item.subscriber
          );

        const reason =
          "Invalid email address after automatic cleaning. Please review this subscriber record.";

        failed +=
          invalidSubscribers.length;

        failedBatches.push({
          emails:
            invalidItems.map(
              (item) =>
                item.originalEmail
            ),
          reason,
        });

        await recordFailedSubscribers({
          campaignId:
            currentCampaignId,

          subscribers:
            invalidSubscribers,

          reason,
        });
      }

      /*
       * If every address in this raw batch was bad,
       * there is nothing to send to Resend.
       */
      if (
        validItems.length ===
        0
      ) {
        continue;
      }

      // Log any values that were repaired.
      for (
        const item of validItems
      ) {
        if (
          item.cleanEmail !==
          String(
            item.originalEmail
          )
            .trim()
            .toLowerCase()
        ) {
          console.log(
            "EMAIL CLEANED:",
            {
              subscriberId:
                item.subscriber
                  .id,
              original:
                item.originalEmail,
              cleaned:
                item.cleanEmail,
            }
          );
        }
      }

      const sendableSubscribers =
        validItems.map(
          (item) =>
            item.subscriber
        );

      const emails =
        validItems.map(
          (item) => ({
            from:
              fromEmail,

            replyTo,

            to:
              item.cleanEmail,

            subject:
              campaignContent
                .subject,

            html:
              createEmailHtml({
                subscriber:
                  item.subscriber,

                heading:
                  campaignContent
                    .heading,

                content:
                  campaignContent
                    .content,

                buttonText:
                  campaignContent
                    .buttonText,

                buttonLink:
                  campaignContent
                    .buttonLink,
              }),
          })
        );

      // ---------------------------------------
      // SEND WITH RETRIES
      // ---------------------------------------

      let batchData:
        | {
            data?:
              ResendBatchResult[];
          }
        | null = null;

      let batchError:
        | {
            message?: string;
          }
        | null = null;

      for (
        let attempt = 1;
        attempt <=
        MAX_BATCH_RETRIES;
        attempt++
      ) {
        const result =
          await resend.batch.send(
            emails
          );

        batchData =
          result.data as
            | {
                data?:
                  ResendBatchResult[];
              }
            | null;

        batchError =
          result.error;

        if (!batchError) {
          break;
        }

        console.error(
          `RESEND BATCH ERROR - attempt ${attempt}/${MAX_BATCH_RETRIES}:`,
          batchError
        );

        if (
          attempt <
          MAX_BATCH_RETRIES
        ) {
          await delay(
            RETRY_DELAY_MS
          );
        }
      }

      // ---------------------------------------
      // RESEND BATCH FAILED
      // ---------------------------------------

      if (batchError) {
        const reason =
          batchError.message ||
          "Unknown Resend error.";

        console.error(
          "RESEND BATCH FAILED AFTER RETRIES:",
          reason,
          validItems.map(
            (item) =>
              item.cleanEmail
          )
        );

        failed +=
          sendableSubscribers.length;

        failedBatches.push({
          emails:
            validItems.map(
              (item) =>
                item.cleanEmail
            ),
          reason,
        });

        await recordFailedSubscribers({
          campaignId:
            currentCampaignId,

          subscribers:
            sendableSubscribers,

          reason,
        });

        continue;
      }

      // ---------------------------------------
      // CHECK RESEND RESPONSE
      // ---------------------------------------

      const resendResults =
        Array.isArray(
          batchData?.data
        )
          ? batchData.data
          : [];

      if (
        resendResults.length !==
        sendableSubscribers.length
      ) {
        await supabase
          .from(
            "announcement_campaigns"
          )
          .update({
            status:
              "partial",
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

            failedBatches,
          },
          {
            status: 500,
          }
        );
      }

      // ---------------------------------------
      // RECORD SUCCESSFUL SENDS
      // ---------------------------------------

      const sentAt =
        new Date()
          .toISOString();

      const records =
        validItems.map(
          (
            item,
            batchIndex
          ) => ({
            campaign_id:
              currentCampaignId,

            subscriber_id:
              Number(
                item.subscriber
                  .id
              ),

            /*
             * Store the cleaned address actually
             * supplied to Resend.
             */
            email:
              item.cleanEmail,

            resend_id:
              resendResults[
                batchIndex
              ]?.id ??
              null,

            status:
              "sent",

            error:
              null,

            sent_at:
              sentAt,
          })
        );

      const {
        error:
          trackingError,
      } = await supabase
        .from(
          "announcement_sends"
        )
        .upsert(
          records,
          {
            onConflict:
              "campaign_id,subscriber_id",
          }
        );

      if (
        trackingError
      ) {
        /*
         * Resend has already accepted these emails.
         * Stop rather than risk duplicate messages.
         */
        await supabase
          .from(
            "announcement_campaigns"
          )
          .update({
            status:
              "partial",
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

            failedBatches,
          },
          {
            status: 500,
          }
        );
      }

      sent +=
        sendableSubscribers.length;

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
      error:
        finalStatusError,
    } = await supabase
      .from(
        "announcement_campaigns"
      )
      .update({
        status:
          complete
            ? "completed"
            : "partial",

        completed_at:
          complete
            ? new Date()
                .toISOString()
            : null,
      })
      .eq(
        "id",
        currentCampaignId
      );

    if (
      finalStatusError
    ) {
      throw new Error(
        finalStatusError
          .message
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
      {
        status: 500,
      }
    );
  }
}