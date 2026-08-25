import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const WEBSITE_URL = "https://asfp-newsletter.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      subject,
      heading,
      content,
      buttonText,
      buttonLink,
      proofEmail,
      sendToAll,
    } = body;

    if (!subject || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject and email content are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // LOAD SUBSCRIBERS
    // -----------------------------------------

    let subscribers: any[] = [];

    if (sendToAll) {
      // Count all active subscribers first
      const { count, error: countError } = await supabase
        .from("subscribers")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("active", true);

      if (countError) {
        throw countError;
      }

      const pageSize = 1000;

      // Load every active subscriber
      for (
        let from = 0;
        from < (count ?? 0);
        from += pageSize
      ) {
        const { data, error } = await supabase
          .from("subscribers")
          .select("*")
          .eq("active", true)
          .order("name", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          throw error;
        }

        subscribers.push(...(data ?? []));
      }
    } else {
      // -----------------------------------------
      // PROOF EMAIL
      // -----------------------------------------

      if (!proofEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "Proof email address is required.",
          },
          { status: 400 }
        );
      }

      const { data: subscriber, error } = await supabase
        .from("subscribers")
        .select("*")
        .eq("email", proofEmail)
        .single();

      if (error || !subscriber) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Proof email must belong to an existing subscriber.",
          },
          { status: 404 }
        );
      }

      subscribers = [subscriber];
    }

    // -----------------------------------------
    // SEND EMAILS
    // -----------------------------------------

    let sent = 0;
    const failed: any[] = [];

    for (const subscriber of subscribers) {
      const unsubscribeUrl =
        `${WEBSITE_URL}/unsubscribe/${subscriber.unsubscribe_token}`;

      const greeting = subscriber.name
        ? `Hello ${subscriber.name},`
        : "Hello,";

      const paragraphs = String(content)
        .split(/\n\s*\n/)
        .filter((paragraph) => paragraph.trim())
        .map(
          (paragraph) =>
            `<p style="margin:0 0 18px 0; line-height:1.7;">${paragraph
              .trim()
              .replace(/\n/g, "<br>")}</p>`
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
          <body style="
            margin:0;
            padding:0;
            background:#f1f5f9;
            font-family:Arial, Helvetica, sans-serif;
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
                          ${heading}
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
                            href="${buttonLink}"
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
                            ${buttonText}
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

      const { error: resendError } =
        await resend.emails.send({
          from: process.env.NEWSLETTER_FROM!,
          replyTo: process.env.NEWSLETTER_REPLY_TO!,
          to: subscriber.email,
          subject,
          html,
        });

      if (resendError) {
        console.error(
          "ANNOUNCEMENT SEND ERROR:",
          subscriber.email,
          resendError
        );

        failed.push({
          email: subscriber.email,
          error: resendError,
        });

        continue;
      }

      sent++;
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
    });

  } catch (error) {
    console.error("ANNOUNCEMENT ERROR:", error);

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