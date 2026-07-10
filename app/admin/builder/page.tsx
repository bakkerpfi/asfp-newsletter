import AdminSidebar from "@/components/AdminSidebar";
import { supabase } from "@/lib/supabase";

export default async function BuilderPage() {

const { data, error } = await supabase
  .from("issues")
  .select(`
    *,
    articles(id),
    polls(id)
  `)
  .order("id", { ascending: false });

if (error) {
  throw error;
}

const issues = data ?? [];

  return (
    <div className="flex">

      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Newsletter Builder
        </h1>

        <p className="mt-2 text-slate-600">
          Select an issue to build and publish.
        </p>

        <div className="mt-8 space-y-6">

          {issues.map((issue: any) => {

            const articleCount = issue.articles?.length ?? 0;
            const pollCount = issue.polls?.length ?? 0;

            return (

              <div
                key={issue.id}
                className="rounded-xl bg-white p-8 shadow"
              >

                <h2 className="text-2xl font-bold text-[#1E2D5A]">
                  {issue.title}
                </h2>

                <p className="mt-2 text-slate-500">
                  Issue {issue.issue_number}
                </p>

                <p className="text-slate-500">
                  {issue.month} {issue.year}
                </p>

                <div className="mt-6 flex gap-8">

                  <div>
                    <p className="text-sm text-slate-500">
                      Articles
                    </p>

                    <p className="text-2xl font-bold">
                      {articleCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Polls
                    </p>

                    <p className="text-2xl font-bold">
                      {pollCount}
                    </p>
                  </div>

                </div>

                <div className="mt-8 flex flex-wrap gap-4">

                  <a
                    href={`/newsletter/${issue.id}`}
                    className="rounded bg-green-600 px-6 py-3 text-white"
                  >
                    Preview
                  </a>

                  <button
                    className="rounded bg-red-500 px-6 py-3 text-white"
                  >
                    Download PDF
                  </button>

                  <button
                    className="rounded bg-[#1E2D5A] px-6 py-3 text-white"
                  >
                    Copy Email
                  </button>

                </div>

              </div>

            );
          })}

        </div>

      </main>

    </div>
  );
}