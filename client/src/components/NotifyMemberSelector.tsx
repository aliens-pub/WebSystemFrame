import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Users, UserPlus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type NotifyMember = {
  knox_id: string;
  name: string;
};

interface NotifyMemberSelectorProps {
  members: NotifyMember[];
  value: NotifyMember[];
  onChange: Dispatch<SetStateAction<NotifyMember[]>>;
}

type DragIntent = "add" | "remove" | null;

export function NotifyMemberSelector({ members, value, onChange }: NotifyMemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [dragIntent, setDragIntent] = useState<DragIntent>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [suppressSelect, setSuppressSelect] = useState(false);

  const toggleMember = (member: NotifyMember, action?: "add" | "remove") => {
    onChange((prev) => {
      const exists = prev.some((item) => item.knox_id === member.knox_id);

      if (action === "add" || (!exists && action !== "remove")) {
        return exists ? prev : [...prev, member];
      }

      if (exists && (action === "remove" || action === undefined)) {
        return prev.filter((item) => item.knox_id !== member.knox_id);
      }

      return prev;
    });
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerUp = () => {
      setIsDragging(false);
      setDragIntent(null);
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isDragging]);

  const handlePointerDown = (member: NotifyMember, isSelected: boolean) => (event: ReactPointerEvent) => {
    event.preventDefault();
    const intent: DragIntent = isSelected ? "remove" : "add";
    setDragIntent(intent);
    setIsDragging(true);
    setSuppressSelect(true);
    toggleMember(member, intent);
  };

  const handlePointerEnter = (member: NotifyMember) => (event: ReactPointerEvent) => {
    if (!isDragging || !dragIntent) {
      return;
    }
    event.preventDefault();
    toggleMember(member, dragIntent);
  };

  const handleClear = () => {
    onChange([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setIsDragging(false);
      setDragIntent(null);
    }
  };

  const selectedIds = useMemo(() => new Set(value.map((member) => member.knox_id)), [value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-muted-foreground">통보처</Label>
        </div>
        <div className="flex items-center gap-2">
          {value.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              전체 제거
            </Button>
          )}
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-1" disabled={!members.length}>
                <UserPlus className="h-4 w-4" />
                통보처 추가
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <Command>
                <CommandInput placeholder="통보처 검색" />
                <CommandEmpty>추가 가능한 통보처가 없습니다.</CommandEmpty>
                <CommandGroup>
                  {members.map((member) => {
                    const isSelected = selectedIds.has(member.knox_id);
                    return (
                      <CommandItem
                        key={member.knox_id}
                        value={`${member.name} ${member.knox_id}`}
                        onSelect={() => {
                          if (suppressSelect) {
                            setSuppressSelect(false);
                            return;
                          }
                          toggleMember(member);
                        }}
                        onPointerDown={handlePointerDown(member, isSelected)}
                        onPointerEnter={handlePointerEnter(member)}
                        className="flex w-full items-center gap-2"
                      >
                        <Checkbox checked={isSelected} readOnly className="pointer-events-none" />
                        <span className="flex-1 text-sm">{member.name}</span>
                        <span className="text-xs text-muted-foreground">{member.knox_id}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.length ? (
          value.map((member) => (
            <Badge key={member.knox_id} variant="secondary" className="flex items-center gap-1">
              <span>{member.name}</span>
              <button
                type="button"
                aria-label={`${member.name} 제거`}
                onClick={() => toggleMember(member, "remove")}
                className="flex items-center justify-center rounded-sm hover:bg-secondary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">선택된 통보처가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export type { NotifyMember };
