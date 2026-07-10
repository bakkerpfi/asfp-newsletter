import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
const { data: latestIssue } = await supabase
  .from("issues")
  .select("*")
  .order("id", { ascending: false })
  .limit(1)
  .single();

  return (
    <main className="min-h-screen bg-slate-100">

<header className="bg-[#1E2D5A] shadow-lg">
  <div className="mx-auto flex max-w-7xl items-center gap-8 px-8 py-6">

    <Image
      src="/AustraliaNewZealand-02.png"
      alt="ASFP Logo"
      width={90}
      height={90}
      priority
    />

    <div>
      <h1 className="text-4xl font-bold text-white">
        ASFP Newsletter Portal
      </h1>

      <p className="mt-1 text-lg text-slate-200">
        Australia & New Zealand Branch
      </p>

      <p className="mt-2 text-sm text-red-300">
        Industry Updates • Technical Articles • Member Engagement
      </p>
    </div>

  </div>
</header>

      <section className="mx-auto max-w-7xl p-10">

  <div className="rounded-xl bg-white p-10 shadow-lg">

    <h2 className="text-3xl font-bold text-[#1E2D5A]">
      Welcome
    </h2>

    <p className="mt-4 text-slate-600">
      Create newsletters, manage subscribers,
      publish industry articles, run member polls,
      and distribute ASFP communications.
    </p>

    <div className="mt-8 flex flex-wrap gap-4">

      <Link
        href="/admin"
        className="rounded bg-[#1E2D5A] px-6 py-3 text-white hover:bg-blue-900"
      >
        Open Dashboard
      </Link>

{latestIssue && (
  <Link
    href={`/newsletter/${latestIssue.id}`}
    className="rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
  >
    Latest Newsletter
  </Link>
)}

    </div>

  </div>

</section>

    </main>
  );
}