import db from "@/lib/database";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import PollCard from "@/components/PollCard";

export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const issueId = Number(id);

  const issue = db.prepare(`
    SELECT *
    FROM issues
    WHERE id = ?
  `).get(issueId) as any;

  const articles = db.prepare(`
    SELECT *
    FROM articles
    WHERE issue_id = ?
    ORDER BY id
  `).all(issueId) as any[];

const polls = db.prepare(`
  SELECT *
  FROM polls
  WHERE issue_id = ?
`).all(issueId);

  return (
    <main className="min-h-screen bg-[#F1F5F9] py-10">

      <div
  id="pdf-main"
  className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl"
>

        {/* HEADER */}

        <div className="bg-[#1E2D5A] px-10 py-8 text-white"
>

<div className="flex items-center gap-8">

  <img
    src="/AustraliaNewZealand-02.png"
    alt="ASFP"
    className="h-48 w-auto"
  />

  <div>

    <h1 className="text-5xl font-bold">
      ASFP Industry Update
    </h1>

    <p className="mt-2 text-2xl text-[#E2E8F0]">
      {issue?.title}
    </p>

    <p className="mt-2 text-[#E2E8F0]">
      Issue {issue?.issue_number ?? id}
    </p>

    <p className="text-[#CBD5E1]">
      {issue?.month} {issue?.year}
    </p>

  </div>

</div>

        </div>

{/* ISSUE SUMMARY */}

<div className="border-b bg-[#F8FAFC] px-10 py-6">

  <h2 className="text-2xl font-semibold text-[#1E2D5A]">
    This Issue
  </h2>

  <div className="mt-6">

    <h3 className="font-semibold text-[#1E2D5A]">
      Contents
    </h3>

    <ul className="mt-2 space-y-1 text-[#334155]">

      {articles.map((article) => (
        <li key={article.id}>
          • {article.title}
        </li>
      ))}

      {polls.length > 0 && (
        <li>
          • Member Poll
        </li>
      )}

    </ul>

  </div>

  {issue?.summary && (

    <div className="mt-6">

      <h3 className="font-semibold text-[#1E2D5A]">
        Editor's Note
      </h3>

      <p className="mt-2 text-[#334155] leading-7">
        {issue.summary}
      </p>

    </div>

  )}

</div>

        {/* ARTICLES */}

        <div className="p-12">


          {articles.length === 0 && (
            <div className="rounded-lg border p-8 text-center text-[#64748B]">
              No articles found for this issue.
            </div>
          )}

          {articles.map((article) => (
            <article
              key={article.id}
              className="mb-12 border-b pb-10 last:border-b-0"
            >

              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#EF4444]">
                {article.category}
              </p>

              <h2 className="text-4xl font-bold text-[#1E2D5A]">
                {article.title}
              </h2>

<div className="mt-6 text-lg leading-8 text-[#334155]">
  {article.content
    .split("\n\n")
    .map((paragraph: string, index: number) => (
      <p key={index} className="mb-6">
        {paragraph.split(/(\s+)/).map((part: string, i: number) => {
          const cleanPart = part.replace(/[().,]+$/g, "");

          const isLink =
            cleanPart.startsWith("www.") ||
            cleanPart.startsWith("http://") ||
            cleanPart.startsWith("https://");

          if (!isLink) {
            return part;
          }

          const url = cleanPart.startsWith("www.")
            ? `https://${cleanPart}`
            : cleanPart;

          const trailing = part.replace(cleanPart, "");

          return (
            <span key={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {cleanPart}
              </a>
              {trailing}
            </span>
          );
        })}
      </p>
    ))}
</div>

              <div className="mt-8 border-t pt-4 text-sm text-[#64748B]">
                Author: {article.author}
                <hr className="mt-10 border-[#CBD5E1]" />
              </div>

            </article>
          ))}

        </div>


      </div>

{/* MEMBER POLLS */}

{polls.length > 0 && (

  <div
    id="pdf-polls"
    className="mx-auto mt-8 max-w-4xl rounded-xl bg-white shadow-xl"
  >

    <div className="flex-1 border-t bg-[#F8FAFC] px-12 py-10">

      <h2 className="mb-8 text-3xl font-bold text-[#1E2D5A]">
        Member Poll
      </h2>

      {polls.map((poll: any) => (
        <div
          key={poll.id}
          className="mb-8 last:mb-0"
        >
          <PollCard poll={poll} />
        </div>
      ))}

    </div>

    <div className="border-t bg-[#F8FAFC] px-10 py-8 text-center">

      <p className="font-semibold text-[#1E2D5A]">
        Association for Specialist Fire Protection
      </p>

      <p className="mt-2 text-sm text-[#64748B]">
        Australia & New Zealand Branch
      </p>

    </div>

  </div>

)}
      <div className="mx-auto mt-6 max-w-4xl">

        <DownloadPdfButton
          title={issue?.title ?? "ASFP Newsletter"}
        />

      </div>

    </main>
  );
}