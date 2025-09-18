import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

interface ExcelTemplateLinkButtonProps {
  url: string;
  title?: string;
}

export function ExcelTemplateLinkButton({ url, title = "엑셀 템플릿 열기" }: ExcelTemplateLinkButtonProps) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={title}
      title={title}
    >
      <FileSpreadsheet className="h-4 w-4" />
    </Button>
  );
}
