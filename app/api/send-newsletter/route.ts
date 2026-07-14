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

          from: "ASFP Australia & New Zealand <newsletter@asfp.co.nz>",
replyTo: "info@asfp.co.nz",

          to: subscriber.email,

          subject: `ASFP ANZ Industry Update – Issue ${latestIssue.issue_number}`,

          html: `
          <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto">

            <h2>Hello ${subscriber.name},</h2>

            <p>
              The latest <strong>ASFP Australia & New Zealand Industry Update</strong>
              is now available.
            </p>

            <p>
              Click below to read your personalised newsletter.
            </p>

            <p style="margin-top:30px">

              <a
                href="${newsletterUrl}"
                style="
                  background:#1E2D5A;
                  color:white;
                  padding:14px 24px;
                  border-radius:6px;
                  text-decoration:none;
                "
              >
                Read Newsletter
              </a>

            </p>

            <hr style="margin:40px 0">

            <p>

              Regards,

              <br><br>

              <strong>Paul Robertson</strong><br>

              Managing Director<br>

              ASFP Australia & New Zealand

            </p>

            <hr>

            <p style="font-size:12px;color:#666">

              You are receiving this email because you subscribed to ASFP updates.

            </p>

            <p>

              <a href="${unsubscribeUrl}">
                Unsubscribe
              </a>

            </p>

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