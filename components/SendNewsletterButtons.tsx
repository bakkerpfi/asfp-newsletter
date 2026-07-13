"use client";

export default function SendNewsletterButtons() {
  async function sendTest() {
    const res = await fetch("/api/send-test", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to send.");
      return;
    }

    alert("✅ Test email sent successfully!");
  }

  async function sendNewsletter() {
    const ok = confirm(
      "Send this newsletter to ALL active subscribers?"
    );

    if (!ok) return;

    const res = await fetch("/api/send-newsletter", {
  method: "POST",
});

const data = await res.json();

if (!res.ok) {
  alert(data.error);
  return;
}

alert(
  `Newsletter complete!\n\nSent: ${data.sent}\nFailed: ${data.failed.length}`
);
  }

  return (
    <div className="flex gap-4">

      <button
        onClick={sendTest}
        className="rounded bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
      >
        Send Test Email
      </button>

      <button
        onClick={sendNewsletter}
        className="rounded bg-[#1E2D5A] px-6 py-3 font-semibold text-white hover:bg-blue-900"
      >
        Send Newsletter
      </button>

    </div>
  );
}