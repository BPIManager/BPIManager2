import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: {
    summary?: HTMLElement | null;
    ranking?: HTMLElement | null;
    list?: HTMLElement | null;
  };
  shareData: { bpi: number; diff: number; rank: number; updateCount: number };
  onShare: (
    element: HTMLElement | null,
    text: string,
    width?: number,
  ) => Promise<boolean>;
  isSharing: boolean;
  handleTabChange: (details: { value: string }) => void;
}

export const ShareResultModal = ({
  isOpen,
  onClose,
  shareData,
  onShare,
  isSharing,
  handleTabChange,
  elements,
}: ShareModalProps) => {
  const [shareType, setShareType] = useState("summary");

  const handleExecute = async () => {
    const target =
      shareType === "summary"
        ? elements.summary
        : shareType === "ranking"
          ? elements.ranking
          : elements.list;
    if (!target) return;
    const text = `BPIM2にスコアを記録!\n総合BPI: ${shareData.bpi.toFixed(2)} (#BPIM2)\n${window.location.href}`;
    if (await onShare(target, text)) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm border-white/10 bg-slate-900 text-white shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-white/5 pb-4">
          <DialogTitle className="text-lg font-bold">画像をシェア</DialogTitle>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-4">
          <p className="text-[11px] leading-relaxed text-slate-400">
            出力対象を選択してください。Twitter用の画像として書き出し、クリップボードにコピーまたは共有ダイアログを開きます。
          </p>

          <RadioGroup
            value={shareType}
            onValueChange={(val) => {
              setShareType(val);
              handleTabChange({ value: val === "list" ? "songs" : "summary" });
            }}
            className="flex flex-col gap-4"
          >
            {[
              {
                id: "summary",
                label: "サマリー",
                desc: "総合BPI・順位・各種分布グラフ",
              },
              {
                id: "ranking",
                label: "ランキング",
                desc: "BPIが伸びた曲 / TOP BPIリスト",
              },
              {
                id: "list",
                label: "楽曲リスト",
                desc: "今回更新した全楽曲のリスト",
              },
            ].map((opt) => (
              <div
                key={opt.id}
                className="flex items-start gap-3 space-x-2 rounded-lg border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
              >
                <RadioGroupItem
                  value={opt.id}
                  id={opt.id}
                  className="mt-1 border-blue-500 text-blue-500"
                />
                <Label
                  htmlFor={opt.id}
                  className="flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-sm font-bold text-white">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {opt.desc}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSharing}
            className="flex-1 text-slate-400"
          >
            キャンセル
          </Button>
          <Button
            disabled={isSharing}
            onClick={handleExecute}
            className="flex-1 bg-blue-600 font-bold hover:bg-blue-500"
          >
            {isSharing ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSharing ? "生成中..." : "シェアする"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
