"use client";

export default function CopyBccButton({
  emails,
}: {
  emails: string;
}) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(emails);

        alert(
          "Subscriber email addresses copied.\n\nPaste directly into Outlook BCC."
        );
      }}
      className="rounded bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
    >
      Copy BCC Subscribers
    </button>
  );
}