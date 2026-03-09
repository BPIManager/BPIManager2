import { useState } from "react";
import { Button, VStack, Stack, Text, Box, Badge } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
  DialogBackdrop,
} from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";

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
  elements,
  shareData,
  onShare,
  isSharing,
  handleTabChange,
}: ShareModalProps) => {
  const [shareType, setShareType] = useState<string>("summary");

  const handleExecute = async () => {
    const target =
      shareType === "summary"
        ? elements.summary
        : shareType === "ranking"
          ? elements.ranking
          : elements.list;

    if (!target) return null;

    const text = `BPIM2に新しいスコアを記録しました!\n更新件数:${shareData.updateCount}件\n\n総合BPI: ${shareData.bpi.toFixed(2)} (${shareData.diff >= 0 ? "+" : ""}${shareData.diff.toFixed(2)})\n推定順位: ${shareData.rank.toLocaleString()}位 #BPIM2 #IIDX\n${window.location.href}`;

    const captureWidth = shareType === "summary" ? 600 : 500;

    const success = await onShare(target, text, captureWidth);
    if (success) onClose();
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement={"center"}
      size="sm"
    >
      <DialogBackdrop backdropFilter={"blur(10px)"} />
      <DialogContent
        bg="#161b22"
        color="white"
        borderRadius="2xl"
        mt={{ mdDown: 2, md: 0 }}
        mx={2}
        p={4}
      >
        <DialogHeader
          fontWeight="bold"
          pb={4}
          borderBottomWidth="1px"
          borderColor="whiteAlpha.100"
        >
          画像をシェア
        </DialogHeader>
        <DialogBody>
          <Text color="gray.200" pb={4} fontSize={"xs"}>
            Twitterでシェア出来る形で画像を書き出します。(他の人があなたのスコアログを閲覧できるURLが添付されます)
            <br />
            画像として出力する対象を選択してください。
          </Text>
          <VStack align="start" gap={6}>
            <RadioGroup
              value={shareType}
              onValueChange={(e) => {
                setShareType(e.value ?? "summary");
                if (e.value === "list") {
                  handleTabChange({ value: "songs" });
                } else {
                  handleTabChange({ value: "summary" });
                }
              }}
              colorPalette="blue"
            >
              <Stack gap={4}>
                <Radio value="summary">
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm">サマリー (総合BPI・順位・分布)</Text>
                    <Text fontSize="xs" color="gray.400">
                      含まれる情報
                      <br />
                      統計情報(総合BPI・推定順位・DJRANK分布・BPI分布)
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="ranking">
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm">ランキング</Text>
                    <Text fontSize="xs" color="gray.400">
                      含まれる情報
                      <br />
                      今回BPIが伸びた曲/トップBPIランキング
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="list">
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm">楽曲リスト</Text>
                    <Text fontSize="xs" color="gray.400">
                      含まれる情報
                      <br />
                      更新した楽曲リスト
                    </Text>
                  </VStack>
                </Radio>
              </Stack>
            </RadioGroup>
          </VStack>
        </DialogBody>
        <DialogFooter gap={3} mt={4}>
          <DialogActionTrigger asChild>
            <Button variant="ghost" disabled={isSharing}>
              キャンセル
            </Button>
          </DialogActionTrigger>
          <Button
            colorPalette="blue"
            loading={isSharing}
            onClick={handleExecute}
            px={8}
          >
            {isSharing ? "画像生成中..." : "シェアする"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
