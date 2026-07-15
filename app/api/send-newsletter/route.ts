import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const WEBSITE_URL = "https://asfp-newsletter.vercel.app";

export async function POST() {
  try {

    // Latest newsletter
    const { data: latestIssue } = await supabase
      .from("issues")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (!latestIssue) {
      return NextResponse.json(
        { error: "No newsletter issue found." },
        { status: 404 }
      );
    }

    // Active subscribers
    const { data: subscribers } = await supabase
      .from("subscribers")
      .select("*")
      .eq("active", true)
      .order("name");

    if (!subscribers?.length) {
      return NextResponse.json(
        { error: "No active subscribers." },
        { status: 404 }
      );
    }

    let sent = 0;
    const failed: string[] = [];

    for (const subscriber of subscribers) {

        // SAFETY MODE
if (subscriber.email !== "ben@bakkerpfi.com") {
  continue;
}

      try {

        const newsletterUrl =
          `${WEBSITE_URL}/newsletter/${latestIssue.id}?u=${subscriber.unsubscribe_token}`;

        const unsubscribeUrl =
          `${WEBSITE_URL}/unsubscribe/${subscriber.unsubscribe_token}`;

        await resend.emails.send({

          from: process.env.NEWSLETTER_FROM!,
          replyTo: process.env.NEWSLETTER_REPLY_TO!,

          to: subscriber.email,

          subject: `ASFP ANZ Industry Update – Issue ${latestIssue.issue_number}`,

html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;color:#333;line-height:1.6;text-align:left;">

<div style="margin-bottom:25px;">
  <img
    src="https://asfp-newsletter.vercel.app/AustraliaNewZealand-03.png"
    alt="ASFP Australia & New Zealand"
    style="max-width:70px;height:auto;display:block;"
  />
</div>

  <h2 style="color:#1E2D5A;margin-top:0;">
    Hello ${subscriber.name},
  </h2>

  <p>
    Thank you for your continued support of
    <strong>ASFP Australia & New Zealand</strong>.
  </p>

  <p>
    We hope you enjoy this edition of the
    <strong>ASFP ANZ Industry Update.</strong>
  </p>

  <p>
    This edition includes:
  </p>

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

  <hr style="margin:40px 0;border:none;border-top:1px solid #ddd;" />

  <p style="font-size:14px;color:#666;">
    You are receiving this email because you have shown interest in Passive Fire Protection previously.
  </p>

  <p style="font-size:14px;color:#666;">
    If you do not wish to receive further industry updates, please unsubscribe and accept our apologies.
  </p>

  <p>
    <a href="${unsubscribeUrl}">
      Unsubscribe
    </a>
  </p>

  <br>

  <strong>Paul Ryan</strong><br>
  Managing Director<br>
  ASFP Australia & New Zealand<br><br>

  Website:
  <a href="https://www.asfp.co.nz">
    www.asfp.co.nz
  </a>

</div>
`

        });

        sent++;

      } catch (err) {

        console.error(err);

        failed.push(subscriber.email);

      }

    }

    return NextResponse.json({

      success: true,

      sent,

      failed,

    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "Unexpected error." },
      { status: 500 }
    );

  }
}