import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import UnsubscribeButton from "@/components/UnsubscribeButton";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .select("id, email, active")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error) {
    console.error("UNSUBSCRIBE PAGE ERROR:", error);
  }

  if (!subscriber) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-3xl font-bold text-[#1E2D5A]">
            Invalid Unsubscribe Link
          </h1>

          <p className="mt-4 text-slate-600">
            This unsubscribe link is invalid or has expired.
          </p>

          <Link
            href="/"
            className="mt-8 inline-block rounded bg-[#1E2D5A] px-6 py-3 text-white"
          >
            Return to ASFP Newsletter
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">

        <div className="bg-[#1E2D5A] px-8 py-8 text-center text-white">
          <Image
            src="/AustraliaNewZealand-02.png"
            alt="ASFP Australia & New Zealand"
            width={160}
            height={100}
            className="mx-auto h-auto w-auto"
            priority
          />

          <h1 className="mt-5 text-3xl font-bold">
            Newsletter Subscription
          </h1>

          <p className="mt-2 text-slate-200">
            ASFP Australia & New Zealand
          </p>
        </div>

        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold text-[#1E2D5A]">
            Unsubscribe
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            You are about to unsubscribe
            <span className="font-semibold">
              {" "}
              {subscriber.email}
            </span>{" "}
            from future ASFP Australia & New Zealand
            newsletters.
          </p>

          <div className="mt-8">
            {subscriber.active ? (
              <UnsubscribeButton token={token} />
            ) : (
              <div className="rounded-lg bg-slate-100 p-5 text-slate-700">
                This email address has already been
                unsubscribed.
              </div>
            )}
          </div>

          <p className="mt-8 text-sm text-slate-500">
            You may contact ASFP ANZ if you wish to
            reactivate your subscription later.
          </p>
        </div>
      </div>
    </main>
  );
}