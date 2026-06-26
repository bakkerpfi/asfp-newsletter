import AdminSidebar from "@/components/AdminSidebar";

export default function NewsletterPage() {
  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Newsletter Builder
        </h1>

        <p className="mt-2 text-slate-600">
          Build and publish newsletter issues.
        </p>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold">
            Issue 01 – July 2026
          </h2>

          <div className="mt-6 space-y-4">

            <div className="rounded border p-4">
              ✓ Chair's Welcome
            </div>

            <div className="rounded border p-4">
              ✓ Council Update
            </div>

            <div className="rounded border p-4">
              ✓ Technical Article
            </div>

            <div className="rounded border p-4">
              ✓ Industry News
            </div>

            <div className="rounded border p-4">
              ✓ Member Poll
            </div>

          </div>

          <div className="mt-8 flex gap-4">

            <button className="rounded bg-[#1E2D5A] px-6 py-3 text-white">
              Preview Newsletter
            </button>

            <button className="rounded bg-red-500 px-6 py-3 text-white">
              Generate PDF
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}