import { useEffect, useMemo, useRef, useState } from "react";
import { Table as TableIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ExcelPasteBoxProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export function ExcelPasteBox({
  value,
  onChange,
  placeholder = "여기에 Excel 표를 붙여넣으세요 (Ctrl+V)",
  id,
  className,
  ariaLabel,
}: ExcelPasteBoxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasTable, setHasTable] = useState<boolean>(false);
  const { toast } = useToast();

  // Unique scope id to avoid any accidental cross instance targeting
  const scopeId = useMemo(() => `excel-paste-box-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const currentHtml = containerRef.current.innerHTML;
    if (value !== currentHtml) {
      containerRef.current.innerHTML = value || "";
      setHasTable(!!containerRef.current.querySelector("table"));
    }
  }, [value]);

  const sanitizeExcelHtmlToSingleTable = (html: string): string | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Remove any style/script elements to prevent global leakage
      doc.querySelectorAll("style, script").forEach((n) => n.remove());

      const table = doc.querySelector("table");
      if (!table) return null;

      // Work on a cloned node so we don't mutate the original
      const cloned = table.cloneNode(true) as HTMLElement;

      // Remove class attributes across the subtree to avoid external CSS interference
      cloned.querySelectorAll("*").forEach((el) => {
        (el as HTMLElement).removeAttribute("class");
        // Remove MSO/Office-specific attributes
        (el as HTMLElement).removeAttribute("lang");
        // Keep inline styles as they preserve Excel formatting; optionally limit dangerous ones
        // Strip potentially dangerous style content like position:fixed etc.
        const style = (el as HTMLElement).getAttribute("style") || "";
        if (style) {
          const safe = style
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s && !/position\s*:/i.test(s) && !/z-index\s*:/i.test(s))
            .join("; ");
          if (safe) (el as HTMLElement).setAttribute("style", safe);
          else (el as HTMLElement).removeAttribute("style");
        }
      });

      // Ensure the top-level table has a basic border collapse so it looks reasonable if no styles
      const existing = cloned.getAttribute("style") || "";
      const merged = [existing, "border-collapse:collapse"].filter(Boolean).join("; ");
      cloned.setAttribute("style", merged);

      // Wrap with a scoped container to ensure isolation per instance
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-scope", scopeId);
      wrapper.appendChild(cloned);
      return wrapper.innerHTML;
    } catch (e) {
      return null;
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const html = clipboardData.getData("text/html");
    if (!html || !html.toLowerCase().includes("<table")) {
      toast({
        title: "표만 붙여넣기 가능",
        description: "Excel에서 복사한 표만 붙여넣을 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    const sanitized = sanitizeExcelHtmlToSingleTable(html);
    if (!sanitized) {
      toast({
        title: "붙여넣기 실패",
        description: "표를 인식하지 못했습니다. Excel에서 표를 다시 복사해 주세요.",
        variant: "destructive",
      });
      return;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = sanitized;
      setHasTable(true);
      onChange(containerRef.current.innerHTML);
    }
  };

  const isSelectionInsideTable = (): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const node = selection.anchorNode as Node | null;
    if (!node) return false;
    const element = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement | null;
    if (!element) return false;
    return !!element.closest("table");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Always block typing when no table exists
    if (!hasTable) {
      event.preventDefault();
      return;
    }

    // Allow navigation keys
    const allowedKeys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Shift",
      "Control",
      "Meta",
      "Alt",
      "Escape",
      "PageUp",
      "PageDown",
      "Home",
      "End",
    ];
    if (allowedKeys.includes(event.key)) return;

    // Allow edits only if selection is inside a table cell
    if (!isSelectionInsideTable()) {
      event.preventDefault();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Keep parent state in sync on direct edits inside the table
  const handleInput = () => {
    if (!containerRef.current) return;
    onChange(containerRef.current.innerHTML);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        id={id}
        aria-label={ariaLabel}
        ref={containerRef}
        className={cn(
          "relative min-h-[140px] w-full rounded-md border-2 border-dashed border-gray-300 bg-white focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "p-3 overflow-auto"
        )}
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onInput={handleInput}
      />

      {!hasTable && (
        <div className="pointer-events-none -mt-[124px] flex h-[124px] items-center justify-center text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <TableIcon className="h-6 w-6" />
            <div className="text-sm">{placeholder}</div>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>일반 텍스트 입력은 불가하며, Excel 표만 지원합니다.</span>
      </div>
    </div>
  );
}

export default ExcelPasteBox;

