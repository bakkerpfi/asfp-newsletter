import AdminSidebar from "@/components/AdminSidebar";
import CopyBccButton from "@/components/CopyBccButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import db from "@/lib/database";

export default function EmailPage() {
  const latestIssue = db.prepare(`
    SELECT *
    FROM issues
    ORDER BY id DESC
    LIMIT 1
  `).get() as any;

  const subscribers = db.prepare(`
    SELECT *
    FROM subscribers
    ORDER BY name
  `).all() as any[];

  const emailList = subscribers
    .map((s) => s.email)
    .join("; ");

  const subscriberCount = db
    .prepare("SELECT COUNT(*) AS count FROM subscribers")
    .get() as { count: number };

  const newsletterUrl = latestIssue
    ? `http://localhost:3000/newsletter/${latestIssue.id}`
    : "";

  const emailSubject =
    latestIssue
      ? `ASFP ANZ Industry Update – Issue ${latestIssue.issue_number}`
      : "";

  const emailBody = `Dear Member,

Please find attached the latest ASFP Australia & New Zealand Industry Update.

This issue includes:

• Industry updates
• Technical articles
• Member news
• Industry polls

Read the latest newsletter online:

ASFP Newsletter

Kind regards,

Association for Specialist Fire Protection
Australia & New Zealand`;

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Email Campaign
        </h1>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          {latestIssue ? (
            <>
              <h2 className="text-2xl font-bold">
                {latestIssue.title}
              </h2>

              <p className="mt-2 text-slate-600">
                Issue {latestIssue.issue_number}
              </p>

              <p className="text-slate-600">
                {latestIssue.month} {latestIssue.year}
              </p>

              <p className="mt-6 text-lg font-semibold text-[#1E2D5A]">
                Subscribers: {subscriberCount.count}
              </p>

              <div className="mt-6 rounded border bg-slate-50 p-6">
                <strong>Email Subject</strong>

                <textarea
                  readOnly
                  rows={2}
                  className="mt-3 w-full rounded border p-3"
                  value={emailSubject}
                />
              </div>

              <div className="mt-6 rounded border bg-slate-50 p-6">
                <strong>Email Body</strong>

                <textarea
                  readOnly
                  rows={14}
                  className="mt-3 w-full rounded border p-3"
                  value={emailBody}
                />
              </div>

              <div className="mt-6 rounded border bg-slate-50 p-6">
                <strong>Newsletter Link</strong>

                <input
                  readOnly
                  className="mt-3 w-full rounded border p-3"
                  value={newsletterUrl}
                />
              </div>

              <div className="mt-6 rounded border bg-slate-50 p-6">
                <strong>BCC Subscriber Emails</strong>

                <textarea
                  readOnly
                  rows={6}
                  className="mt-3 w-full rounded border p-3"
                  value={emailList}
                />
              </div>

<div className="mt-8 flex flex-wrap gap-4">

  <a
    href={newsletterUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
  >
    Preview Newsletter
  </a>

  <CopyLinkButton url={newsletterUrl} />

  <CopyBccButton emails={emailList} />

  <a
    href={`mailto:?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`}
    className="rounded bg-blue-700 px-6 py-3 text-white hover:bg-blue-800"
  >
    Open Outlook
  </a>

</div>

              <div className="mt-8 rounded-lg border border-orange-200 bg-orange-50 p-6">

<p className="font-semibold text-orange-800">
  Sending Instructions
</p>

<ol className="mt-4 list-decimal space-y-2 pl-6 text-sm text-slate-700">
  <li>Click "Open Outlook".</li>
  <li>The Subject and Email Body will automatically populate.</li>
  <li>Click "Copy Newsletter Link".</li>
  <li>Highlight/Select "ASFP Newsletter" press Ctrl+V or paste</li>
  <li>Click "Copy BCC Subscribers".</li>
  <li>Paste the email addresses into the Outlook BCC field.</li>
  <li>Click Send.</li>
</ol>

              </div>

            </>
          ) : (
            <p className="text-slate-500">
              No newsletter issue has been created.
            </p>
          )}

        </div>

      </main>
    </div>
  );
}