"use client";

export default function CopyPersonalLinkButton({
  url,
}: {
  url: string;
}) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url);
        alert("Personal newsletter link copied.");
      }}
      className="rounded bg-[#1E2D5A] px-4 py-2 text-white hover:bg-blue-900"
    >
      Copy Link
    </button>
  );
}