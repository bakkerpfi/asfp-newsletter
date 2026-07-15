import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const WEBSITE_URL = "https://asfp-newsletter.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    // Find the subscriber
    const { data: subscriber, error } = await supabase
      .from("subscribers")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found." },
        { status: 404 }
      );
    }

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

    const newsletterUrl =
      `${WEBSITE_URL}/newsletter/${latestIssue.id}?u=${subscriber.unsubscribe_token}`;

    const unsubscribeUrl =
      `${WEBSITE_URL}/unsubscribe/${subscriber.unsubscribe_token}`;

const { data, error: resendError } = await resend.emails.send({
  from: process.env.NEWSLETTER_FROM!,
  replyTo: process.env.NEWSLETTER_REPLY_TO!,
  to: subscriber.email,
  subject: `ASFP Industry Update – Issue ${latestIssue.issue_number}`,
html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;color:#333;line-height:1.6;">

  <div style="text-align:center;margin-bottom:35px;">
    <img
      src="https://www.asfp.co.nz/wp-content/uploads/2024/09/AustraliaNewZealand-02.png"
      alt="ASFP Australia & New Zealand"
      style="max-width:220px;height:auto;"
    />
  </div>

  <h2 style="color:#1E2D5A;">
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

  Mob: +64 (0) 27 338 3338<br>
  Tel: 0800 304 355<br>

  Website:
  <a href="https://www.asfp.co.nz">
    www.asfp.co.nz
  </a>

</div>
`
    });

    if (resendError) {
      return NextResponse.json(resendError, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Unexpected error." },
      { status: 500 }
    );
  }
}