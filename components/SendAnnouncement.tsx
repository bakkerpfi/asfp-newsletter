"use client";

import { useState } from "react";

type Props = {
  subscriberCount: number;
};

export default function SendAnnouncement({
  subscriberCount,
}: Props) {
  const [subject, setSubject] = useState(
    "ASFP ANZ – Raising the Bar"
  );

  const [heading, setHeading] = useState(
    "ASFP ANZ – Raising the Bar"
  );

  const [content, setContent] = useState(
`The passive fire protection world has moved on a lot since the Grenfell Tower disaster in 2017, many lessons have been learnt, many parts of the world have had major changes in their approach to passive fire protection, with the delivery of new guidance, training, qualifications and competency.

New Zealand has found it hard keeping up, maybe through a lack of resource or the lack of a passive fire protection trade association to drive forward new initiatives.

ASFP ANZ has been established to address this and even though our branch is only six months old, we start delivering this week with the launch of our new publicly accessible technical hub at www.asfp.co.nz.

The new hub contains technical guidance, advisory notes, position statements, best practice guides, passive inspection guides and much more.

If your involvement with passive fire protection is firestopping, fire doors, structural fire protection, fire & smoke curtains, fire resistant ducting, fire dampers, building envelopes, floors, walls and ceilings, and you’re either a manufacture, designer, installer, inspector or occupier, we believe you will find the information held within the hub interesting.

This is the first of many initiatives that ASFP ANZ will deliver, we have much more planned and will announce the next initiative very shortly.`
  );

  const [buttonText, setButtonText] = useState(
    "Visit the ASFP ANZ Technical Hub"
  );

  const [buttonLink, setButtonLink] = useState(
    "https://www.asfp.co.nz/"
  );

  const [proofEmail, setProofEmail] = useState("");

  const [sendingProof, setSendingProof] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  async function sendProof() {
    if (!proofEmail.trim()) {
      alert("Please enter a proof email address.");
      return;
    }

    setSendingProof(true);

    try {
      const response = await fetch(
        "/api/send-announcement",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            heading,
            content,
            buttonText,
            buttonLink,
            proofEmail: proofEmail.trim(),
            sendToAll: false,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.error ||
            "Failed to send proof email."
        );
        return;
      }

      alert(
        `Proof email sent successfully to ${proofEmail}.`
      );
    } catch (error) {
      console.error(error);
      alert("Failed to send proof email.");
    } finally {
      setSendingProof(false);
    }
  }

  async function sendToAll() {
    const confirmed = confirm(
      `Are you sure you want to email this announcement to ALL ${subscriberCount} active subscribers?\n\nThis cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmation = confirm(
      `FINAL CONFIRMATION\n\nSend "${subject}" to ${subscriberCount} active subscribers now?`
    );

    if (!secondConfirmation) {
      return;
    }

    setSendingAll(true);

    try {
      const response = await fetch(
        "/api/send-announcement",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            heading,
            content,
            buttonText,
            buttonLink,
            sendToAll: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.error ||
            "Failed to send announcement."
        );
        return;
      }

      alert(
        `Announcement complete!\n\nSent: ${result.sent}\nFailed: ${result.failed?.length ?? 0}`
      );
    } catch (error) {
      console.error(error);
      alert("Failed to send announcement.");
    } finally {
      setSendingAll(false);
    }
  }

  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim());

  return (
    <div className="mt-8">

      {/* EMAIL EDITOR */}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-8">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <h2 className="text-2xl font-bold text-[#1E2D5A]">
              Email Announcement
            </h2>

            <p className="mt-2 text-slate-700">
              Create a standalone ASFP email announcement.
            </p>
          </div>

          <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Subscribers
            </p>

            <p className="text-2xl font-bold text-[#1E2D5A]">
              {subscriberCount}
            </p>
          </div>

        </div>

        <div className="mt-8 grid gap-5">

          <div>
            <label className="font-semibold text-slate-700">
              Email Subject
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded border bg-white p-3"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">
              Heading
            </label>

            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="mt-2 w-full rounded border bg-white p-3"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">
              Announcement Content
            </label>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="mt-2 w-full rounded border bg-white p-3"
            />

            <p className="mt-2 text-sm text-slate-500">
              Separate paragraphs with a blank line.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="font-semibold text-slate-700">
                Button Text
              </label>

              <input
                type="text"
                value={buttonText}
                onChange={(e) =>
                  setButtonText(e.target.value)
                }
                className="mt-2 w-full rounded border bg-white p-3"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">
                Button Link
              </label>

              <input
                type="url"
                value={buttonLink}
                onChange={(e) =>
                  setButtonLink(e.target.value)
                }
                className="mt-2 w-full rounded border bg-white p-3"
              />
            </div>

          </div>

        </div>

      </div>

      {/* LIVE EMAIL PREVIEW */}

      <div className="mt-8 rounded-xl bg-white p-8 shadow">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          <div>
            <h2 className="text-2xl font-bold text-[#1E2D5A]">
              Live Email Preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This preview updates automatically as you edit the email.
            </p>
          </div>

          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            Live Preview
          </span>

        </div>

        {/* EMAIL CLIENT STYLE WRAPPER */}

        <div className="overflow-hidden rounded-xl border bg-slate-100">

          {/* SUBJECT PREVIEW */}

          <div className="border-b bg-white px-6 py-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Subject
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {subject || "Email subject"}
            </p>

          </div>

          <div className="p-4 md:p-8">

            <div className="mx-auto max-w-[700px] overflow-hidden rounded-lg bg-white shadow">

              {/* ASFP BLUE BANNER */}

              <div
                className="border-b-4 border-[#F52B3A] px-8 py-5 text-center"
                style={{
                  backgroundColor: "#1E2D5A",
                }}
              >

                <img
                  src="/AustraliaNewZealand-02.png"
                  alt="ASFP Australia & New Zealand"
                  style={{
                    display: "block",
                    width: "140px",
                    maxWidth: "100%",
                    height: "auto",
                    margin: "0 auto",
                  }}
                />

              </div>

              {/* EMAIL CONTENT */}

              <div className="p-8 md:p-10">

                <p className="mb-6 text-base text-slate-800">
                  Hello Ben,
                </p>

                {heading && (
                  <h1 className="mb-6 text-3xl font-bold leading-tight text-[#1E2D5A]">
                    {heading}
                  </h1>
                )}

                <div className="text-base leading-7 text-slate-700">

                  {paragraphs.length > 0 ? (
                    paragraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="mb-5"
                      >
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="italic text-slate-400">
                      Your announcement content will appear here.
                    </p>
                  )}

                </div>

                {buttonText && buttonLink && (
                  <div className="mt-8">

                    <a
                      href={buttonLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-md bg-[#F52B3A] px-6 py-4 font-bold text-white no-underline"
                    >
                      {buttonText}
                    </a>

                  </div>
                )}

              </div>

              {/* EMAIL FOOTER */}

              <div className="border-t bg-slate-50 px-8 py-6 text-xs leading-5 text-slate-500">

                <p>
                  You are receiving this email because you are
                  subscribed to ASFP Australia & New Zealand
                  industry updates.
                </p>

                <p className="mt-3 underline">
                  Unsubscribe
                </p>

              </div>

            </div>

          </div>

        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          The exact appearance may vary slightly between Outlook,
          Gmail, Apple Mail and mobile devices.
        </p>

      </div>

      {/* SEND PROOF */}

      <div className="mt-8 rounded-xl border bg-white p-6 shadow">

        <h3 className="text-xl font-bold text-[#1E2D5A]">
          Send Proof
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          Send a proof before sending the announcement to
          the full subscriber list.
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">

          <input
            type="email"
            value={proofEmail}
            onChange={(e) =>
              setProofEmail(e.target.value)
            }
            placeholder="Proof recipient email"
            className="flex-1 rounded border p-3"
          />

          <button
            type="button"
            onClick={sendProof}
            disabled={sendingProof || sendingAll}
            className="rounded bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendingProof
              ? "Sending Proof..."
              : "Send Proof Email"}
          </button>

        </div>

      </div>

      {/* SEND TO ALL */}

      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">

        <h3 className="text-xl font-bold text-red-700">
          Send Announcement
        </h3>

        <p className="mt-2 text-slate-700">
          This will send the announcement to all{" "}
          <strong>
            {subscriberCount} active subscribers
          </strong>.
        </p>

        <p className="mt-2 text-sm font-semibold text-red-600">
          Send and approve a proof email before using this button.
        </p>

        <button
          type="button"
          onClick={sendToAll}
          disabled={sendingProof || sendingAll}
          className="mt-5 rounded bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sendingAll
            ? "Sending Announcement..."
            : `Send to All ${subscriberCount} Active Subscribers`}
        </button>

      </div>

    </div>
  );
}