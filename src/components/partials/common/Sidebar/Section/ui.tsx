import { ReactNode } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  label: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** サイドバーが展開表示中かどうか。折りたたみ時はホバーするまでトリガーを隠す */
  expanded: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

/**
 * サイドバーの折りたたみ可能なメニューセクション(スコア/ライバル/分析/ベータ/情報)を
 * 共通化したもの。開閉状態は呼び出し側で管理し、中身の項目はchildrenで渡す。
 */
const SidebarSection = ({
  label,
  isOpen,
  onOpenChange,
  expanded,
  badge,
  children,
}: SidebarSectionProps) => (
  <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start gap-3 px-3 text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text data-[state=open]:bg-transparent",
          !expanded && "hidden group-hover/sidebar:flex",
        )}
      >
        {isOpen ? (
          <ChevronDown className="h-5 w-5 shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0" />
        )}
        <span className="text-xs font-bold tracking-wider">{label}</span>
        {badge}
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent className="flex flex-col gap-1 mt-1">
      {children}
    </CollapsibleContent>
  </Collapsible>
);

export default SidebarSection;
