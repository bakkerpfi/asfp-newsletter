"use client";

export default function CopyLinkButton({
  url,
}: {
  url: string;
}) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url);

        alert(
          "Newsletter link copied to clipboard."
        );
      }}
      className="rounded bg-slate-700 px-6 py-3 text-white hover:bg-slate-800"
    >
      Copy Newsletter Link
    </button>
  );
}