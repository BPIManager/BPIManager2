import { useState } from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Stack,
  Icon,
  HStack,
  Input,
} from "@chakra-ui/react";
import { LuKey, LuCopy, LuRefreshCw } from "react-icons/lu";
import { toaster } from "@/components/ui/chakra/toaster";
import { useApiKey } from "@/hooks/users/useAPIKey";
import { ActionConfirmDialog } from "../../Modal/Confirmation";

export default function ApiKeyUi() {
  const { keyInfo, generate, isLoading } = useApiKey();
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const executeGenerate = async () => {
    try {
      const key = await generate();
      setRawKey(key);
      toaster.create({
        title:
          "APIキーを発行しました。この画面を閉じると二度と表示されません。",
        type: "success",
      });
      setIsConfirmOpen(false);
    } catch (e) {
      toaster.create({
        title: "発行に失敗しました",
        type: "error",
      });
    }
  };

  const handleGenerateClick = () => {
    if (keyInfo?.exists) {
      setIsConfirmOpen(true);
    } else {
      executeGenerate();
    }
  };

  const copyToClipboard = () => {
    const text = rawKey || keyInfo?.key;
    if (text) {
      navigator.clipboard.writeText(text);
      toaster.create({ title: "コピーしました", type: "success" });
    }
  };

  return (
    <Box
      mt={4}
      p={6}
      bg="gray.900"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "start", md: "center" }}
        gap={6}
      >
        <VStack align="start" gap={1}>
          <HStack color="blue.400">
            <Icon as={LuKey} />
            <Text fontWeight="bold">APIキー</Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            API経由でBPIM2のデータを取得・更新します。
          </Text>
        </VStack>

        <HStack w={{ base: "full", md: "400px" }} gap={0}>
          <Input
            px={3}
            value={rawKey || keyInfo?.key || ""}
            placeholder={isLoading ? "Loading..." : "未発行"}
            readOnly
            borderRightRadius={0}
            variant="subtle"
            fontSize="xs"
            fontFamily="mono"
            bg="blackAlpha.400"
            borderColor="whiteAlpha.200"
          />
          {(rawKey || keyInfo?.exists) && (
            <Button
              variant="ghost"
              borderRadius={0}
              borderYWidth="1px"
              borderColor="whiteAlpha.200"
              onClick={copyToClipboard}
              px={3}
            >
              <LuCopy />
            </Button>
          )}
          <Button
            borderLeftRadius={0}
            colorPalette="blue"
            loading={isLoading}
            onClick={handleGenerateClick}
            variant="solid"
            px={6}
            flexShrink={0}
          >
            {keyInfo?.exists ? <LuRefreshCw /> : "発行"}
          </Button>
        </HStack>
      </Stack>
      {rawKey && (
        <Text mt={2} fontSize="xs" color="orange.400" fontWeight="bold">
          ⚠️ 注意: このキーは今だけ表示されています。必ず控えてください。
        </Text>
      )}

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeGenerate}
        isLoading={isLoading}
        title="APIキーの再発行"
        description="新しいキーを発行しますか？古いキーは即座に無効化され、以前のキーを使用したアプリケーションは動作しなくなります。"
        confirmLabel="再発行する"
        cancelLabel="キャンセル"
        isDestructive
      />
    </Box>
  );
}
