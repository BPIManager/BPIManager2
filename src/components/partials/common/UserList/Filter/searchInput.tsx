"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const SearchInput = ({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (val: string) => void;
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // 入力中はURL由来の値で上書きしない（遷移待ちの間に打った文字を消さない）
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== initialValue) onSearchRef.current(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, initialValue]);

  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-bpim-muted">
        <Search className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        placeholder={t("rivals.search.placeholder")}
        className="h-10 pl-10 border-none bg-bpim-bg/40 text-bpim-text focus-visible:ring-blue-500"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
