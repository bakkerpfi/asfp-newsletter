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
      from: "ASFP Australia & New Zealand <onboarding@resend.dev>",
      to: subscriber.email,
      subject: `ASFP Industry Update – Issue ${latestIssue.issue_number}`,
      html: `
        <h2>Hello ${subscriber.name},</h2>

        <p>
          Thank you for your continued support of
          <strong>ASFP Australia & New Zealand</strong>.
        </p>

        <p>
          We hope you enjoy this edition of our Industry Update.
        </p>

        <p>
          <a
            href="${newsletterUrl}"
            style="
              background:#1E2D5A;
              color:white;
              padding:12px 20px;
              text-decoration:none;
              border-radius:6px;
              display:inline-block;
            "
          >
            Read Newsletter
          </a>
        </p>

        <hr>

        <p style="color:#666">
          You are receiving this email because you subscribed to receive
          ASFP Australia & New Zealand Industry Updates.
        </p>

        <p>
          <a href="${unsubscribeUrl}">
            Unsubscribe
          </a>
        </p>
      `,
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