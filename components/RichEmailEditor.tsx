"use client";

import {
  useEffect,
  useRef,
} from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function RichEmailEditor({
  value,
  onChange,
  disabled = false,
}: Props) {
  const editorRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (
      editor &&
      editor.innerHTML !== value
    ) {
      editor.innerHTML = value;
    }
  }, [value]);

  function runCommand(
    command: string,
    commandValue?: string
  ) {
    if (disabled) return;

    editorRef.current?.focus();

    document.execCommand(
      command,
      false,
      commandValue
    );

    syncContent();
  }

  function syncContent() {
    const editor = editorRef.current;

    if (!editor) return;

    onChange(editor.innerHTML);
  }

  function addLink() {
    if (disabled) return;

    const url = window.prompt(
      "Enter the link URL:"
    );

    if (!url) return;

    const trimmed = url.trim();

    let safeUrl = trimmed;

    if (
      !/^https?:\/\//i.test(trimmed) &&
      !/^mailto:/i.test(trimmed)
    ) {
      if (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          trimmed
        )
      ) {
        safeUrl = `mailto:${trimmed}`;
      } else {
        safeUrl = `https://${trimmed}`;
      }
    }

    runCommand("createLink", safeUrl);
  }

  function clearFormatting() {
    if (disabled) return;

    editorRef.current?.focus();

    document.execCommand(
      "removeFormat",
      false
    );

    syncContent();
  }

  const buttonClass =
    "rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-300 bg-white">

      <div className="flex flex-wrap gap-2 border-b bg-slate-50 p-3">

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            runCommand("bold")
          }
          className={buttonClass}
          title="Bold"
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            runCommand("italic")
          }
          className={buttonClass}
          title="Italic"
        >
          <em>I</em>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            runCommand("underline")
          }
          className={buttonClass}
          title="Underline"
        >
          <u>U</u>
        </button>

        <div className="mx-1 border-l border-slate-300" />

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            runCommand(
              "insertUnorderedList"
            )
          }
          className={buttonClass}
          title="Bullet list"
        >
          • Bullets
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            runCommand(
              "insertOrderedList"
            )
          }
          className={buttonClass}
          title="Numbered list"
        >
          1. Numbering
        </button>

        <div className="mx-1 border-l border-slate-300" />

        <button
          type="button"
          disabled={disabled}
          onClick={addLink}
          className={buttonClass}
          title="Add link"
        >
          Link
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            runCommand("unlink")
          }
          className={buttonClass}
          title="Remove link"
        >
          Unlink
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={clearFormatting}
          className={buttonClass}
          title="Clear formatting"
        >
          Clear
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        className={`min-h-[320px] p-5 text-base leading-7 outline-none ${
          disabled
            ? "cursor-not-allowed bg-slate-100"
            : "bg-white"
        }`}
        data-placeholder="Write your announcement..."
      />
    </div>
  );
}