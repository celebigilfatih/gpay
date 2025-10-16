"use client";

import * as React from "react";
import { X, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type OptionType = {
  value: string;
  label: string;
};

interface SearchableMultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seçiniz...",
  className,
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı.",
}: SearchableMultiSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Arama sonuçlarını filtrele
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Seçim işlemi
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // Seçimi kaldır
  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  // Dışarı tıklandığında kapat
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Seçili öğeleri göster */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((value) => {
            const option = options.find(opt => opt.value === value);
            return (
              <Badge
                key={value}
                variant="secondary"
                className="text-xs"
              >
                {option?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemove(value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Arama input'u */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
        />
      </div>

      {/* Dropdown listesi */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  selected.includes(option.value) && "bg-accent"
                )}
                onClick={() => handleSelect(option.value)}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selected.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50"
                  )}
                >
                  {selected.includes(option.value) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}