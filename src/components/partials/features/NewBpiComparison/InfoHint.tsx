import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * ラベル横に置く `?` アイコン。クリック（タップ）でその項目が何を表すかの
 * 説明をポップオーバーで表示する。ホバーではなくクリック起点にすることで
 * モバイルでも開ける。
 */
export default function InfoHint({ label, text }: { label: string; text: string }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className="inline-flex align-middle text-bpim-muted transition-colors hover:text-bpim-text focus-visible:text-bpim-text focus-visible:outline-none"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 text-xs leading-relaxed">
        {text}
      </PopoverContent>
    </Popover>
  );
}
