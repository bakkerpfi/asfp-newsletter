import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PollCard from "@/components/PollCard";
import Link from "next/link";

type NewsletterPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    u?: string;
  }>;
};

export default async function NewsletterPage({
  params,
  searchParams,
}: NewsletterPageProps) {
  const { id } = await params;
  const { u } = await searchParams;

  const issueId = Number(id);

  if (!Number.isFinite(issueId)) {
    notFound();
  }

  // =====================================================
  // ISSUE
  //
  // The issue determines the company.
  // Public users cannot choose a company separately.
  // =====================================================

  const {
    data: issue,
    error: issueError,
  } = await supabase
    .from("issues")
    .select("*")
    .eq("id", issueId)
    .maybeSingle();

  if (
    issueError ||
    !issue ||
    !issue.company_id
  ) {
    notFound();
  }

  const companyId =
    issue.company_id;

  // =====================================================
  // COMPANY BRANDING
  // =====================================================

  const {
    data: company,
    error: companyError,
  } = await supabase
    .from("companies")
    .select(
      `
      id,
      name,
      slug,
      logo_url,
      primary_colour,
      secondary_colour,
      accent_colour,
      website_url,
      company_address,
      sender_name,
      sender_email,
      reply_to_email,
      footer_phone,
      footer_tagline,
      footer_show_address,
      footer_show_phone,
      footer_show_website
      `
    )
    .eq("id", companyId)
    .eq("active", true)
    .maybeSingle();

  if (
    companyError ||
    !company
  ) {
    notFound();
  }

  // =====================================================
  // ARTICLES
  //
  // Both issue_id AND company_id must match.
  // =====================================================

  const {
    data: articles,
  } = await supabase
    .from("articles")
    .select("*")
    .eq(
      "issue_id",
      issueId
    )
    .eq(
      "company_id",
      companyId
    )
    .order("id", {
      ascending: true,
    });

  // =====================================================
  // POLLS
  // =====================================================

  const {
    data: polls,
  } = await supabase
    .from("polls")
    .select("*")
    .eq(
      "issue_id",
      issueId
    )
    .eq(
      "company_id",
      companyId
    )
    .order("id", {
      ascending: true,
    });

  const safeArticles =
    articles ?? [];

  const safePolls =
    polls ?? [];


  const authorIds = safeArticles
    .map((article) => article.author_id)
    .filter(Boolean);

  const { data: authorRows } = authorIds.length > 0
    ? await supabase
        .from("article_authors")
        .select("id,name,job_title,photo_url")
        .eq("company_id", companyId)
        .in("id", authorIds)
    : { data: [] as any[] };

  const authorsById = new Map(
    (authorRows ?? []).map((profile: any) => [
      String(profile.id),
      profile,
    ])
  );

  const articleIds = safeArticles.map((article) => article.id);

  const { data: blockRows } = articleIds.length > 0
    ? await supabase
        .from("article_blocks")
        .select("*")
        .eq("company_id", companyId)
        .in("article_id", articleIds)
        .order("sort_order", { ascending: true })
    : { data: [] as any[] };

  const blocksByArticle = new Map<number, any[]>();

  for (const block of blockRows ?? []) {
    const current = blocksByArticle.get(block.article_id) ?? [];
    current.push(block);
    blocksByArticle.set(block.article_id, current);
  }

  // =====================================================
  // SUBSCRIBER PERSONALISATION
  //
  // A subscriber token must belong to the SAME
  // company as the newsletter issue.
  // =====================================================

  let subscriber: any = null;

  if (u) {
    const {
      data: subscriberData,
    } = await supabase
      .from("subscribers")
      .select("*")
      .eq(
        "unsubscribe_token",
        u
      )
      .eq(
        "company_id",
        companyId
      )
      .maybeSingle();

    subscriber =
      subscriberData;
  }

  // =====================================================
  // BRANDING
  // =====================================================

  const primaryColour =
    company.primary_colour ||
    "#1E2D5A";

  const secondaryColour =
    company.secondary_colour ||
    "#F52B3A";

  const accentColour =
    company.accent_colour ||
    secondaryColour;

  const companyName =
    company.name;

  const isAsfp =
    company.slug === "asfp";

  const newsletterHeading =
    isAsfp
      ? "ASFP Industry Update"
      : `${companyName} Update`;

  const greetingText =
    isAsfp
      ? "Thank you for your continued support of ASFP Australia & New Zealand. We hope you enjoy this edition of our Industry Update."
      : `Thank you for your continued interest in ${companyName}. We hope you enjoy this edition of our newsletter.`;

  const showFooterAddress =
    company.footer_show_address !== false &&
    Boolean(company.company_address);

  const showFooterPhone =
    company.footer_show_phone !== false &&
    Boolean(company.footer_phone);

  const showFooterWebsite =
    company.footer_show_website !== false &&
    Boolean(company.website_url);

  const footerContact =
    [
      showFooterPhone
        ? company.footer_phone
        : null,
      showFooterWebsite
        ? company.website_url
        : null,
    ].filter(Boolean);

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-100 py-10">

      {/* MAIN NEWSLETTER */}

      <div
        id="pdf-main"
        className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl"
      >

        {/* HEADER */}

        <div
          className="px-10 py-8 text-white"
          style={{
            backgroundColor:
              primaryColour,
          }}
        >

          <div className="flex items-center gap-8">

            {/* COMPANY LOGO */}

            {company.logo_url ? (

<img
  src={company.logo_url}
  alt={companyName}
  className="max-h-40 w-auto max-w-[320px] object-contain"
/>

            ) : isAsfp ? (

              <img
                src="/AustraliaNewZealand-02.png"
                alt="ASFP Australia & New Zealand"
                className="h-40 w-auto"
              />

            ) : (

              <div
                className="flex h-28 min-w-28 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 text-center text-2xl font-bold"
              >
                {companyName}
              </div>

            )}

<div>
  <h1 className="text-3xl font-bold leading-tight">
    {newsletterHeading}
  </h1>

  <p className="mt-2 text-lg text-white/90">
    {issue.title}
  </p>

  <p className="mt-2 text-sm text-white/80">
    Issue{" "}
    {issue.issue_number ?? id}
  </p>

  <p className="text-sm text-white/70">
    {issue.month}{" "}
    {issue.year}
  </p>
</div>

          </div>

        </div>

        {/* PERSONAL GREETING */}

        {subscriber && (

          <div className="border-b bg-green-50 px-10 py-8">

            <h2
              className="text-3xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Hello
              {subscriber.name
                ? `, ${subscriber.name}`
                : ""}
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              {greetingText}
            </p>

          </div>

        )}

        {/* ISSUE SUMMARY */}

        <div className="border-b bg-slate-50 px-10 py-6">

          <h2
            className="text-2xl font-semibold"
            style={{
              color:
                primaryColour,
            }}
          >
            This Issue
          </h2>

          <div className="mt-6">

            <h3
              className="font-semibold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Contents
            </h3>

            <ul className="mt-2 space-y-1 text-slate-700">

              {safeArticles.map(
                (article) => (

                  <li
                    key={
                      article.id
                    }
                  >
                    • {article.title}
                  </li>

                )
              )}

              {safePolls.length >
                0 && (

                <li>
                  • Member Poll
                </li>

              )}

            </ul>

          </div>

          {issue.summary && (

            <div className="mt-6">

              <h3
                className="font-semibold"
                style={{
                  color:
                    primaryColour,
                }}
              >
                Editor&apos;s Note
              </h3>

              <p className="mt-2 leading-7 text-slate-700">
                {issue.summary}
              </p>

            </div>

          )}

        </div>

        {/* ARTICLES */}

        <div className="p-12">

          {safeArticles.length ===
            0 && (

            <div className="rounded-lg border p-8 text-center text-slate-500">
              No articles found for
              this issue.
            </div>

          )}

          {safeArticles.map(
            (article) => (

              <article
                key={article.id}
                className="mb-12 border-b pb-10 last:border-b-0"
              >

                {article.category && (

                  <p
                    className="mb-2 text-sm font-semibold uppercase tracking-wide"
                    style={{
                      color:
                        secondaryColour,
                    }}
                  >
                    {
                      article.category
                    }
                  </p>

                )}

                <h2
                  className="text-4xl font-bold"
                  style={{
                    color:
                      primaryColour,
                  }}
                >
                  {article.title}
                </h2>

                {article.author_id && authorsById.get(String(article.author_id)) && (() => {
                  const profile = authorsById.get(String(article.author_id));
                  return (
                    <div className="mt-5 flex items-center gap-4">
                      {profile.photo_url && (
                        <img
                          src={profile.photo_url}
                          alt={profile.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold" style={{ color: primaryColour }}>
                          {profile.name}
                        </p>
                        {profile.job_title && (
                          <p className="text-sm text-slate-500">{profile.job_title}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-6 text-lg leading-8 text-slate-700">
                  {(blocksByArticle.get(article.id) ?? []).length > 0 ? (
                    (blocksByArticle.get(article.id) ?? []).map((block: any) => {
                      if (block.block_type === "text") {
                        return (
                          <div key={block.id}>
                            {String(block.content ?? "")
                              .split("\n\n")
                              .map((paragraph: string, index: number) => (
                                <p key={index} className="mb-6 whitespace-pre-line">
                                  {paragraph}
                                </p>
                              ))}
                          </div>
                        );
                      }

                      if (block.block_type === "image" && block.image_url) {
                        const widthClass =
                          block.image_size === "small" ? "max-w-xs" :
                          block.image_size === "medium" ? "max-w-md" :
                          block.image_size === "large" ? "max-w-2xl" : "w-full";

                        const alignClass =
                          block.image_alignment === "left" ? "mr-auto" :
                          block.image_alignment === "right" ? "ml-auto" : "mx-auto";

                        const captionAlign =
                          block.image_alignment === "left" ? "text-left" :
                          block.image_alignment === "right" ? "text-right" : "text-center";

                        return (
                          <figure key={block.id} className="my-8">
                            <img
                              src={block.image_url}
                              alt={block.caption || article.title}
                              className={`${widthClass} ${alignClass} h-auto rounded-lg`}
                            />
                            {block.caption && (
                              <figcaption className={`mt-2 text-sm text-slate-500 ${captionAlign}`}>
                                {block.caption}
                              </figcaption>
                            )}
                          </figure>
                        );
                      }

                      if (block.block_type === "quote" && block.content) {
                        return (
                          <blockquote
                            key={block.id}
                            className="my-8 rounded-r-lg border-l-4 bg-slate-50 px-6 py-5 text-xl font-medium italic leading-8 text-slate-700"
                            style={{ borderColor: secondaryColour }}
                          >
                            {block.content}
                          </blockquote>
                        );
                      }

                      return null;
                    })
                  ) : (
                    String(article.content ?? "")
                      .split("\n\n")
                      .map((paragraph: string, index: number) => (
                        <p key={index} className="mb-6 whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))
                  )}
                </div>

                {article.author && !article.author_id && (

                  <div className="mt-8 border-t pt-4 text-sm text-slate-500">
                    Author:{" "}
                    {article.author}
                  </div>

                )}

              </article>

            )
          )}

        </div>

      </div>

      {/* POLLS */}

      {safePolls.length > 0 && (

        <div
          id="pdf-polls"
          className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl"
        >

          <div className="border-t bg-slate-50 px-12 py-10">

            <h2
              className="mb-8 text-3xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              Member Poll
            </h2>

            {safePolls.map(
              (poll: any) => (

                <div
                  key={poll.id}
                  className="mb-8 last:mb-0"
                >
                  <PollCard
                    poll={poll}
                  />
                </div>

              )
            )}

          </div>

          {/* SUBSCRIPTION */}

          <div className="border-t bg-slate-50 px-10 py-10">

            <h3
              className="text-2xl font-bold"
              style={{
                color:
                  primaryColour,
              }}
            >
              About Your Subscription
            </h3>

            {subscriber ? (

              <>

                <p className="mt-6 text-slate-700">
                  This newsletter has
                  been sent to:
                </p>

                {subscriber.name && (

                  <p
                    className="mt-4 text-xl font-semibold"
                    style={{
                      color:
                        primaryColour,
                    }}
                  >
                    {subscriber.name}
                  </p>

                )}

                {subscriber.company && (

                  <p className="text-slate-600">
                    {
                      subscriber.company
                    }
                  </p>

                )}

                <div className="mt-12 border-t pt-8 text-center">

                  <p className="leading-7 text-slate-600">
                    You are receiving
                    this email because
                    you have previously
                    shown an interest
                    in{" "}
                    {companyName} or
                    its industry
                    updates. If you do
                    not wish to receive
                    future emails,
                    please unsubscribe
                    below.
                  </p>

                  <Link
                    href={`/unsubscribe/${subscriber.unsubscribe_token}`}
                    className="mt-4 inline-block text-sm font-semibold underline"
                    style={{
                      color:
                        secondaryColour,
                    }}
                  >
                    Unsubscribe from
                    these emails
                  </Link>

                </div>

              </>

            ) : (

              <p className="mt-6 leading-7 text-slate-600">
                Thank you for reading
                the {companyName}{" "}
                newsletter.
              </p>

            )}

            {/* COMPANY FOOTER */}

            <hr className="my-10" />

            <div className="text-center">

              <h4
                className="font-semibold"
                style={{ color: primaryColour }}
              >
                {companyName}
              </h4>

              {company.footer_tagline && (
                <p className="mt-2 text-sm text-slate-500">
                  {company.footer_tagline}
                </p>
              )}

              {showFooterAddress && (
                <p className="mt-2 text-sm text-slate-500">
                  {company.company_address}
                </p>
              )}

              {footerContact.length > 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  {footerContact.join(" · ")}
                </p>
              )}

              {showFooterWebsite && (
                <p className="mt-3">
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold underline"
                    style={{ color: accentColour }}
                  >
                    Visit our website
                  </a>
                </p>
              )}

              <p className="mt-6 text-xs text-slate-400">
                © {new Date().getFullYear()} {companyName}
              </p>

            </div>

          </div>

        </div>

      )}

      {/* FOOTER WHEN THERE IS NO POLL */}

      {safePolls.length === 0 && (

        <div className="mx-auto mt-8 max-w-4xl rounded-xl bg-white px-10 py-10 text-center shadow-xl">

          {subscriber && (

            <>

              <p className="text-sm text-slate-600">
                This newsletter was
                sent to{" "}
                <strong>
                  {subscriber.email}
                </strong>
                .
              </p>

              <Link
                href={`/unsubscribe/${subscriber.unsubscribe_token}`}
                className="mt-4 inline-block text-sm font-semibold underline"
                style={{
                  color:
                    secondaryColour,
                }}
              >
                Unsubscribe from these
                emails
              </Link>

            </>

          )}

          <h4
            className={`font-semibold ${subscriber ? "mt-8" : ""}`}
            style={{ color: primaryColour }}
          >
            {companyName}
          </h4>

          {company.footer_tagline && (
            <p className="mt-2 text-sm text-slate-500">
              {company.footer_tagline}
            </p>
          )}

          {showFooterAddress && (
            <p className="mt-2 text-sm text-slate-500">
              {company.company_address}
            </p>
          )}

          {footerContact.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              {footerContact.join(" · ")}
            </p>
          )}

          {showFooterWebsite && (
            <p className="mt-3">
              <a
                href={company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold underline"
                style={{ color: accentColour }}
              >
                Visit our website
              </a>
            </p>
          )}

          <p className="mt-6 text-xs text-slate-400">
            © {new Date().getFullYear()} {companyName}
          </p>

        </div>

      )}

      <div className="mx-auto mt-8 max-w-4xl text-center text-sm text-slate-500">
        Thank you for reading the{" "}
        {companyName} newsletter.
      </div>

    </main>
  );
}
