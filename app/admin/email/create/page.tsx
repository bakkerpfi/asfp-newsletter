import AdminSidebar from "@/components/AdminSidebar";
import SendAnnouncement from "@/components/SendAnnouncement";
import { supabase } from "@/lib/supabase";

export default async function CreateEmailPage() {
  const { count, error } = await supabase
    .from("subscribers")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("active", true);

  if (error) {
    console.error(
      "ACTIVE SUBSCRIBER COUNT ERROR:",
      error
    );
  }

  const subscriberCount = count ?? 0;

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Create Email
        </h1>

        <p className="mt-2 text-slate-600">
          Create and send a standalone ASFP email
          announcement.
        </p>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
          This is for standalone announcements and industry
          updates. For the regular ASFP newsletter, use
          Newsletter Campaign.
        </div>

        <SendAnnouncement
          subscriberCount={subscriberCount}
        />

      </main>
    </div>
  );
}