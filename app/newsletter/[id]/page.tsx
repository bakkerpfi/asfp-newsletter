import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PollCard from "@/components/PollCard";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export default async function NewsletterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ u?: string }>;
}) {
  const { id } = await params;
  const { u } = await searchParams;

  const issueId = Number(id);
  let subscriber: any = null;

if (u) {
  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .eq("unsubscribe_token", u)
    .maybeSingle();

  subscriber = data;
  console.log("Token:", u);
console.log("Subscriber:", subscriber);
}

const { data: issue } = await supabase
  .from("issues")
  .select("*")
  .eq("id", issueId)
  .single();

const { data: articles } = await supabase
  .from("articles")
  .select("*")
  .eq("issue_id", issueId)
  .order("id", { ascending: true });

const { data: polls } = await supabase
  .from("polls")
  .select("*")
  .eq("issue_id", issueId);

const safeArticles = articles ?? [];
const safePolls = polls ?? [];

if (!issue) {
  notFound();
}

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

        {subscriber && (

  <div className="border-b bg-green-50 px-10 py-8">

<h2 className="text-3xl font-bold text-[#1E2D5A]">
  Hello, {subscriber.name}
</h2>

<p className="mt-4 leading-7 text-slate-600">
  Thank you for your continued support of ASFP Australia & New Zealand.
  We hope you enjoy this edition of our Industry Update.
</p>

  </div>

)}

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

      {safeArticles.map((article) => (
        <li key={article.id}>
          • {article.title}
        </li>
      ))}

      {safePolls.length > 0 && (
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

        {/* safeArticles */}

        <div className="p-12">


          {safeArticles.length === 0 && (
            <div className="rounded-lg border p-8 text-center text-[#64748B]">
              No articles found for this issue.
            </div>
          )}

{safeArticles.map((article) => (
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

{safePolls.length > 0 && (

  <div
    id="pdf-polls"
    className="mx-auto mt-8 max-w-4xl rounded-xl bg-white shadow-xl"
  >

    <div className="flex-1 border-t bg-[#F8FAFC] px-12 py-10">

      <h2 className="mb-8 text-3xl font-bold text-[#1E2D5A]">
        Member Poll
      </h2>

      {safePolls.map((poll: any) => (
        <div
          key={poll.id}
          className="mb-8 last:mb-0"
        >
          <PollCard poll={poll} />
        </div>
      ))}

    </div>

<div className="border-t bg-[#F8FAFC] px-10 py-10">

  <h3 className="text-2xl font-bold text-[#1E2D5A]">
    About Your Subscription
  </h3>

  {subscriber ? (

    <>

      <p className="mt-6 text-slate-700">
        This newsletter has been sent to:
      </p>

      <p className="mt-4 text-xl font-semibold text-[#1E2D5A]">
        {subscriber.name}
      </p>

      <p className="text-slate-600">
        {subscriber.company}
      </p>

      <p className="mt-6 text-slate-600 leading-7">
        You're receiving this newsletter because you're subscribed to
        receive ASFP Australia & New Zealand industry updates.
      </p>

<div className="mt-12 border-t pt-8 text-center">

  <p className="text-sm text-slate-500">
    You are receiving this email because you subscribed to
    ASFP Australia & New Zealand Industry Updates.
  </p>

  <Link
    href={`/unsubscribe/${subscriber.unsubscribe_token}`}
    className="mt-4 inline-block text-sm font-semibold text-red-600 underline hover:text-red-700"
  >
    Unsubscribe from these emails
  </Link>

</div>

<p className="mt-6 text-sm text-slate-500">
  Our secure Member Portal is currently under development. Soon you'll be able
  to manage your profile, browse previous newsletters, vote in member polls,
  and access exclusive ASFP member resources.
</p>

    </>

  ) : (

    <>

      <p className="mt-6 text-slate-600 leading-7">
        Thank you for reading the ASFP Australia & New Zealand Industry Update.
      </p>

      <p className="mt-4 text-slate-600">
        Visit our website to learn more about ASFP and become a subscriber.
      </p>

    </>

  )}

  <hr className="my-10" />

  <div className="text-center">

    <h4 className="font-semibold text-[#1E2D5A]">
      Association for Specialist Fire Protection
    </h4>

    <p className="text-slate-500">
      Australia & New Zealand Branch
    </p>

    <p className="mt-4 text-sm text-slate-500">
      Keeping the passive fire protection industry informed through
      collaboration, education and technical excellence.
    </p>

    <p className="mt-6 text-xs text-slate-400">
      © {new Date().getFullYear()} ASFP Australia & New Zealand
    </p>

  </div>

</div>

  </div>

)}
<div className="mx-auto mt-8 max-w-4xl text-center text-sm text-slate-500">

  Thank you for reading the ASFP Australia & New Zealand Industry Update.

</div>

    </main>
  );
}