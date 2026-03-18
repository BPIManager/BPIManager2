"use client";

import { useState, useEffect } from "react";
import { LuSearch } from "react-icons/lu";
import { Input } from "@/components/ui/input";

export const SearchInput = ({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (val: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== initialValue) onSearch(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, initialValue, onSearch]);

  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
        <LuSearch className="h-4 w-4" />
      </div>
      <Input
        placeholder="ユーザー名またはIIDX IDで検索"
        className="h-10 pl-10 border-none bg-black/40 text-slate-200 focus-visible:ring-blue-500"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};
