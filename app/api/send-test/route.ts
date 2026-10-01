import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const resend = new Resend(process.env.RESEND_API_KEY);
const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000";

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const fromEmail = process.env.NEWSLETTER_FROM;
    const defaultReplyTo = process.env.NEWSLETTER_REPLY_TO;

    if (!fromEmail || !defaultReplyTo) {
      return NextResponse.json(
        { error: "Newsletter email settings are not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const companySlug = String(body.companySlug ?? "").trim();
    const issueId = Number(body.issueId);
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!companySlug || !Number.isFinite(issueId) || !email) {
      return NextResponse.json(
        { error: "Company, issue and proof email address are required." },
        { status: 400 }
      );
    }

    const tenant = await requireCompanyAccess(companySlug);
    const companyId = tenant.company.id;

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id,name,slug,logo_url,primary_colour,secondary_colour,website_url,sender_name,sender_email,reply_to_email")
      .eq("id", companyId)
      .eq("active", true)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Company could not be loaded." },
        { status: 404 }
      );
    }

    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("id,company_id,issue_number,title,month,year")
      .eq("id", issueId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (issueError) throw issueError;

    if (!issue) {
      return NextResponse.json(
        { error: "This newsletter issue does not belong to the selected company." },
        { status: 403 }
      );
    }

    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("id,name,email,unsubscribe_token,active,company_id")
      .eq("company_id", companyId)
      .ilike("email", email)
      .maybeSingle();

    if (subscriberError) throw subscriberError;

    if (!subscriber) {
      return NextResponse.json(
        { error: `No subscriber with that email exists for ${company.name}.` },
        { status: 404 }
      );
    }

    const primaryColour = company.primary_colour || "#1E2D5A";
    const secondaryColour = company.secondary_colour || "#F52B3A";
    const companyName = escapeHtml(company.name);
    const subscriberName = escapeHtml(subscriber.name?.trim() || "Member");

    const newsletterUrl =
      `${WEBSITE_URL}/newsletter/${issue.id}?u=` +
      encodeURIComponent(subscriber.unsubscribe_token);

    const unsubscribeUrl =
      `${WEBSITE_URL}/unsubscribe/` +
      encodeURIComponent(subscriber.unsubscribe_token);

    const logoHtml = company.logo_url
      ? `<img src="${escapeHtml(company.logo_url)}" alt="${companyName}" style="display:block;max-width:180px;max-height:90px;width:auto;height:auto;margin:0 auto;" />`
      : `<div style="color:#ffffff;font-size:24px;font-weight:bold;text-align:center;">${companyName}</div>`;

    const issueDate = [issue.month, issue.year].filter(Boolean).join(" ");

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
          <div style="max-width:700px;margin:0 auto;padding:30px 15px;">
            <div style="background:#ffffff;border-radius:10px;overflow:hidden;">
              <div style="background:${primaryColour};padding:25px 30px;text-align:center;border-bottom:4px solid ${secondaryColour};">
                ${logoHtml}
              </div>
              <div style="padding:35px;line-height:1.7;">
                <div style="margin-bottom:20px;padding:10px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;color:#9a3412;font-size:13px;font-weight:bold;">
                  PROOF EMAIL — ${companyName}
                </div>
                <h2 style="color:${primaryColour};margin:0 0 20px 0;">Hello ${subscriberName},</h2>
                <p>Thank you for your continued interest in <strong>${companyName}</strong>.</p>
                <p>We hope you enjoy this edition of our newsletter.</p>
                <div style="margin:28px 0;padding:20px;background:#f8fafc;border-left:4px solid ${secondaryColour};">
                  <div style="color:${primaryColour};font-size:22px;font-weight:bold;">
                    ${escapeHtml(issue.title || "Newsletter")}
                  </div>
                  <div style="margin-top:6px;color:#64748b;font-size:14px;">
                    Issue ${escapeHtml(String(issue.issue_number ?? issue.id))}
                    ${issueDate ? ` · ${escapeHtml(issueDate)}` : ""}
                  </div>
                </div>
                <p>Click the button below to open the personalised newsletter exactly as this subscriber would see it.</p>
                <p style="margin:35px 0;">
                  <a href="${newsletterUrl}" style="background:${secondaryColour};color:#ffffff;padding:14px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                    Read Newsletter
                  </a>
                </p>
                <hr style="margin:40px 0;border:none;border-top:1px solid #e2e8f0;" />
                <p style="font-size:13px;color:#64748b;">
                  This proof uses the selected ${companyName} subscriber record so the personalised newsletter and unsubscribe links can be checked safely.
                </p>
                <p><a href="${unsubscribeUrl}" style="color:${secondaryColour};">Unsubscribe</a></p>
                <div style="margin-top:35px;color:#475569;">
                  <strong>${escapeHtml(company.sender_name || company.name)}</strong><br />
                  ${companyName}
                  ${company.website_url ? `<br /><a href="${escapeHtml(company.website_url)}" style="color:${primaryColour};">${escapeHtml(company.website_url)}</a>` : ""}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const companyFromEmail =
      company.sender_email
        ? `${company.sender_name || company.name} <${company.sender_email}>`
        : fromEmail;

    const { data, error: resendError } = await resend.emails.send({
      from: companyFromEmail,
      replyTo: company.reply_to_email || defaultReplyTo,
      to: subscriber.email,
      subject: `[PROOF] ${company.name} Newsletter – Issue ${issue.issue_number ?? issue.id}`,
      html,
    });

    if (resendError) {
      return NextResponse.json(
        { error: resendError.message || "Proof email failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proof: true,
      company: { id: company.id, name: company.name, slug: company.slug },
      issue: { id: issue.id, number: issue.issue_number, title: issue.title },
      subscriber: { id: subscriber.id, name: subscriber.name, email: subscriber.email },
      resendId: data?.id ?? null,
    });
  } catch (error) {
    console.error("SEND TEST ERROR:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      {
        status:
          message === "Authentication required."
            ? 401
            : message.includes("access")
            ? 403
            : 500,
      }
    );
  }
}
