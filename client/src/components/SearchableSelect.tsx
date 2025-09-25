import * as React from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, X } from "lucide-react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* 공통 타입/함수                                                      */
/* ------------------------------------------------------------------ */
export type Option = { label: string; value: string };

const norm = (v: unknown) =>
  (v ?? "").toString().normalize("NFKC").toLowerCase().trim();

/* ------------------------------------------------------------------ */
/* 단일 선택: 기존 SearchableSelect (요구대로 원형 유지)               */
/* ------------------------------------------------------------------ */
export interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  items: Option[];
  loadingText?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  items,
  loadingText = "로드 중...",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // label 기준으로 필터링
  const filteredItems = useMemo(() => {
    const q = norm(searchTerm);
    return (items ?? [])
      .filter((it) => norm(it.label).includes(q))
      .sort((a, b) => norm(a.label).localeCompare(norm(b.label)));
  }, [items, searchTerm]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearchTerm("");
  };

  // 현재 선택된 value에 대응하는 label 찾아서 트리거에 표시
  const triggerLabel =
    items.find((it) => it.value === value)?.label ?? (placeholder ?? "선택하세요");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {triggerLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="검색..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-64 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm ? "검색 결과가 없습니다." : loadingText}
              </div>
            ) : (
              filteredItems.map((it) => (
                <CommandItem
                  key={it.value}
                  value={it.label}
                  onSelect={() => handleSelect(it.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      it.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {it.label}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* 다중 선택: SearchableMultiSelect (체크박스 드롭다운)                */
/* ------------------------------------------------------------------ */
export interface SearchableMultiSelectProps {
  items: Option[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  maxBadgePreview?: number; // 트리거에서 배지로 미리보일 개수(기본 2)
}

export function SearchableMultiSelect({
  items,
  value,
  onValueChange,
  placeholder = "선택하세요",
  loadingText = "로드 중...",
  disabled = false,
  className,
  maxBadgePreview = 2,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filteredItems = useMemo(() => {
    const q = norm(searchTerm);
    return (items ?? [])
      .filter((it) => norm(it.label).includes(q))
      .sort((a, b) => norm(a.label).localeCompare(norm(b.label)));
  }, [items, searchTerm]);

  const selectedItems = useMemo(
    () => items.filter((o) => selectedSet.has(o.value)),
    [items, selectedSet]
  );

  const toggle = (v: string) => {
    if (selectedSet.has(v)) onValueChange(value.filter((x) => x !== v));
    else onValueChange([...value, v]);
  };

  const triggerContent =
    value.length > 0 ? (
      <div className="flex max-w-[80%] flex-wrap gap-1">
        {selectedItems.slice(0, maxBadgePreview).map((o) => (
          <Badge key={o.value} variant="secondary">
            {o.label}
          </Badge>
        ))}
        {value.length > maxBadgePreview && (
          <Badge variant="outline">+{value.length - maxBadgePreview}</Badge>
        )}
      </div>
    ) : (
      <span className="text-muted-foreground">{placeholder}</span>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {triggerContent}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="검색..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-64 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm ? "검색 결과가 없습니다." : loadingText}
              </div>
            ) : (
              <CommandGroup>
                {filteredItems.map((item) => {
                  const checked = selectedSet.has(item.value);
                  return (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      className="flex items-center gap-2 cursor-pointer"
                      onSelect={() => toggle(item.value)} // 행 클릭 토글
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(item.value)} // 체크박스 토글
                        aria-label={item.label}
                      />
                      <span className="flex-1">{item.label}</span>
                      {checked && <Check className="h-4 w-4 opacity-70" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* 변경 의뢰 항목 선택: ChangeRequestItemSelector                      */
/* ------------------------------------------------------------------ */
export interface ChangeRequestOption {
  name: string;
  standardTat?: number | null;
}

interface ChangeRequestItemSelectorProps {
  options: ChangeRequestOption[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onMaxTatChange: (maxTat: number | null) => void;
  placeholder?: string;
}

export function ChangeRequestItemSelector({
  options,
  selectedItems,
  onSelectionChange,
  onMaxTatChange,
  placeholder = "변경 의뢰 항목 선택",
}: ChangeRequestItemSelectorProps) {
  const [open, setOpen] = useState(false);

  const uniqueOptions = useMemo(() => {
    const map = new Map<string, ChangeRequestOption>();
    for (const option of options) {
      const existing = map.get(option.name);
      if (!existing) {
        map.set(option.name, option);
      } else if (existing.standardTat == null && option.standardTat != null) {
        map.set(option.name, option);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [options]);

  const tatMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const option of uniqueOptions) {
      if (option.standardTat != null) {
        map.set(option.name, option.standardTat);
      }
    }
    return map;
  }, [uniqueOptions]);

  useEffect(() => {
    const tatValues = selectedItems
      .map((item) => tatMap.get(item))
      .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));

    if (tatValues.length === 0) {
      onMaxTatChange(null);
    } else {
      onMaxTatChange(Math.max(...tatValues));
    }
  }, [selectedItems, tatMap, onMaxTatChange]);

  const handleToggle = useCallback(
    (option: ChangeRequestOption, checked: CheckedState) => {
      const isChecked = checked === true;
      let nextSelected: string[];

      if (isChecked) {
        nextSelected = Array.from(new Set([...selectedItems, option.name]));
      } else {
        nextSelected = selectedItems.filter((item) => item !== option.name);
      }

      onSelectionChange(nextSelected);
    },
    [selectedItems, onSelectionChange]
  );

  const handleRemove = useCallback(
    (item: string) => {
      onSelectionChange(selectedItems.filter((selected) => selected !== item));
    },
    [selectedItems, onSelectionChange]
  );

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10"
          >
            {selectedItems.length > 0
              ? `${selectedItems.length}개 항목 선택됨`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <div className="max-h-60 overflow-auto">
            <div className="p-2">
              {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
                    >
                      <span>{item}</span>
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer hover:bg-blue-200 rounded"
                        onClick={() => handleRemove(item)}
                      />
                    </div>
                  ))}
                </div>
              )}
              {uniqueOptions.length === 0 ? (
                <div className="text-xs text-gray-500 p-2">선택 가능한 항목이 없습니다.</div>
              ) : (
                uniqueOptions.map((option) => (
                  <div
                    key={option.name}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
                  >
                    <Checkbox
                      id={`change-item-${option.name}`}
                      checked={selectedItems.includes(option.name)}
                      onCheckedChange={(checked) => handleToggle(option, checked)}
                    />
                    <Label
                      htmlFor={`change-item-${option.name}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {option.name}
                    </Label>
                    {option.standardTat != null && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        TAT: {option.standardTat}일
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
