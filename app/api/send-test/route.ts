import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    // Get your own subscriber record (change the email if required)
    const { data: subscriber, error } = await supabase
      .from("subscribers")
      .select("*")
      .eq("email", "ben@bakkerpfi.com")
      .single();

    if (error || !subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found." },
        { status: 404 }
      );
    }

    const newsletterUrl =
      `http://localhost:3000/newsletter/3?u=${subscriber.unsubscribe_token}`;

    const unsubscribeUrl =
      `http://localhost:3000/unsubscribe/${subscriber.unsubscribe_token}`;

    const { data, error: resendError } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: subscriber.email,
      subject: "ASFP Industry Update – Issue 1",
      html: `
        <h2>Hello ${subscriber.name},</h2>

        <p>
          The latest <strong>ASFP Australia & New Zealand Industry Update</strong>
          is now available.
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
          You are receiving this email because you subscribed to ASFP
          Australia & New Zealand.
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