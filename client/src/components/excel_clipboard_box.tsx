import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Table as TableIcon, FileSpreadsheet } from "lucide-react";

interface ExcelClipboardBoxProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// Sanitize pasted HTML to a single table element and strip global-affecting tags
function sanitizeExcelHtmlToSingleTable(rawHtml: string): string | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    // Remove global-affecting tags
    doc.querySelectorAll("style, link, meta, script, xml").forEach((el) => el.remove());

    // Prefer the first table inside the fragment
    const table = doc.querySelector("table");
    if (!table) return null;

    // Clone to detach from source document
    const tableClone = table.cloneNode(true) as HTMLElement;

    // Remove ids/classes that could collide across pastes
    const elements = [tableClone, ...Array.from(tableClone.querySelectorAll("*"))] as HTMLElement[];
    for (const el of elements) {
      el.removeAttribute("id");
      el.removeAttribute("class");
      // Keep inline styles from Excel; they are scoped within shadow DOM
    }

    // Ensure table renders cleanly; allow natural width so horizontal scroll can appear
    tableClone.style.borderCollapse = tableClone.style.borderCollapse || "collapse";

    return tableClone.outerHTML;
  } catch (e) {
    console.warn("Failed to sanitize Excel HTML:", e);
    return null;
  }
}

export default function ExcelClipboardBox({ value, onChange, placeholder, className }: ExcelClipboardBoxProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shadowRootRef, setShadowRootRef] = useState<ShadowRoot | null>(null);

  // Style scoped to shadow DOM to avoid leaking
  const shadowStyles = useMemo(() => {
    return `
      <style>
        :host { all: initial; }
        .excel-container { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
        table { width: max-content; border-collapse: collapse; }
        td, th { border: 1px solid #e5e7eb; padding: 4px 6px; font-size: 12px; color: #111827; }
      </style>
    `;
  }, []);

  // Attach shadow root once
  useEffect(() => {
    const host = hostRef.current;
    if (host && !host.shadowRoot) {
      const shadow = host.attachShadow({ mode: "open" });
      setShadowRootRef(shadow);
    } else if (host && host.shadowRoot && !shadowRootRef) {
      setShadowRootRef(host.shadowRoot);
    }
  }, [shadowRootRef]);

  // Render current value into shadow DOM
  useEffect(() => {
    if (!shadowRootRef) return;
    const content = value ? `${shadowStyles}<div class="excel-container">${value}</div>` : `${shadowStyles}`;
    // Replace full content each time; simple and safe
    shadowRootRef.innerHTML = content;
  }, [shadowRootRef, shadowStyles, value]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    if (!html) {
      // Only accept HTML table paste
      return;
    }
    // Quick check to ensure table exists in the fragment
    if (!/\<table[\s\S]*\<\/table\>/i.test(html)) {
      return;
    }
    const sanitized = sanitizeExcelHtmlToSingleTable(html);
    if (!sanitized) return;
    onChange(sanitized);
  }, [onChange]);

  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLDivElement> & { inputType?: string }) => {
    // Block any typing; allow paste (handled separately) and deletion for clearing
    // React types don't include inputType on FormEvent; cast via any
    const event: any = e;
    const inputType = event.inputType as string | undefined;
    if (!inputType) return;
    if (inputType === "insertFromPaste") return; // handled by onPaste
    if (inputType === "deleteContentBackward" || inputType === "deleteContentForward") return;
    event.preventDefault?.();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
      if (value) onChange("");
    }
  }, [onChange, value]);

  const hasContent = Boolean(value && value.trim().length > 0);

  return (
    <div
      className={`relative rounded-md border-2 border-dashed border-slate-300 min-h-32 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring overflow-x-auto ${className || ""}`}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onBeforeInput={handleBeforeInput as any}
      // Make it focusable and act like an input target for paste
      tabIndex={0}
      role="textbox"
      aria-label={placeholder || "Excel 표 입력"}
    >
      {/* Shadow host renders the isolated table */}
      <div ref={hostRef} />

      {/* Placeholder */}
      {!hasContent && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>{placeholder || "여기에 Excel 표를 붙여넣으세요."}</span>
          </div>
        </div>
      )}
    </div>
  );
}

