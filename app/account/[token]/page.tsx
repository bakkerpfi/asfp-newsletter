import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EditProfileCard from "@/components/EditProfileCard";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!subscriber) {
    notFound();
  }

  const { data: newsletters } = await supabase
    .from("issues")
    .select("*")
    .order("id", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-100">

      {/* Header */}

      <header className="bg-[#1E2D5A] shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-8 py-8">

          <Image
            src="/AustraliaNewZealand-02.png"
            alt="ASFP"
            width={90}
            height={90}
            priority
          />

          <div>
            <h1 className="text-4xl font-bold text-white">
              ASFP Member Portal
            </h1>

            <p className="mt-2 text-slate-200">
              Australia & New Zealand Branch
            </p>
          </div>

        </div>
      </header>

      <div className="mx-auto mt-10 max-w-6xl space-y-8">

        {/* Welcome */}

        <div className="rounded-xl bg-white p-8 shadow">

          <h2 className="text-3xl font-bold text-[#1E2D5A]">
            Welcome {subscriber.name}
          </h2>

          <p className="mt-3 text-slate-600">
            Manage your newsletter subscription and browse previous
            ASFP Industry Updates.
          </p>

        </div>

        {/* Subscription */}

        <div className="rounded-xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold text-[#1E2D5A]">
            Subscription Status
          </h2>

          <div className="mt-6 flex items-center gap-4">

            {subscriber.active ? (

              <span className="rounded bg-green-100 px-4 py-2 font-semibold text-green-700">
                ✓ Active Subscriber
              </span>

            ) : (

              <span className="rounded bg-red-100 px-4 py-2 font-semibold text-red-700">
                ✕ Unsubscribed
              </span>

            )}

          </div>

          <div className="mt-8">

            {subscriber.active ? (

              <Link
                href={`/unsubscribe/${subscriber.unsubscribe_token}`}
                className="rounded bg-red-600 px-6 py-3 text-white hover:bg-red-700"
              >
                Unsubscribe
              </Link>

            ) : (

              <form
                action="/api/subscribers/reactivate"
                method="POST"
              >

                <input
                  type="hidden"
                  name="token"
                  value={subscriber.unsubscribe_token}
                />

                <button
                  className="rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
                >
                  Reactivate Subscription
                </button>

              </form>

            )}

          </div>

        </div>

<EditProfileCard subscriber={subscriber} />

        {/* Newsletter Archive */}

        <div className="rounded-xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold text-[#1E2D5A]">
            Newsletter Archive
          </h2>

          <div className="mt-6 space-y-4">

            {newsletters?.map((issue) => (

              <div
                key={issue.id}
                className="flex items-center justify-between rounded border p-4"
              >

                <div>

                  <h3 className="font-semibold">
                    {issue.title}
                  </h3>

                  <p className="text-sm text-slate-500">
                    Issue {issue.issue_number} • {issue.month} {issue.year}
                  </p>

                </div>

                <Link
                  href={`/newsletter/${issue.id}`}
                  className="rounded bg-[#1E2D5A] px-5 py-2 text-white hover:bg-blue-900"
                >
                  Read
                </Link>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>
  );
}