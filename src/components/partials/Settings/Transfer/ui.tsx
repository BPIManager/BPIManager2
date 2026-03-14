import {
  Box,
  VStack,
  Text,
  Button,
  Stack,
  Icon,
  HStack,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { LuRefreshCw, LuDatabase } from "react-icons/lu";
import { useUser } from "@/contexts/users/UserContext";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { useState } from "react";
import { useFirestoreDataCheck } from "@/hooks/firestore/checkData";
import { versionTitles } from "@/constants/versions";
import { toaster } from "@/components/ui/toaster";
import { API_PREFIX } from "@/constants/apiEndpoints";

export default function TransferUi() {
  const { fbUser } = useUser();
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { checkData, foundVersions, isChecking } = useFirestoreDataCheck(
    fbUser?.uid,
  );

  const handleOpenConfirm = async () => {
    setIsConfirmOpen(true);
    await checkData();
  };

  const handleSyncFirestore = async () => {
    if (!fbUser?.uid) return;

    setIsSyncing(true);
    try {
      const idToken = await fbUser.getIdToken(true);
      const response = await fetch(
        `${API_PREFIX}/users/${fbUser.uid}/scores/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("転送失敗");

      toaster.create({
        title: "完了",
        description: "データの移行が完了しました。",
        duration: 8000,
        closable: true,
        type: "success",
      });
      setIsConfirmOpen(false);
    } catch (e) {
      toaster.create({
        title: "完了しませんでした",
        description: "エラーが発生したため処理が完了しませんでした",
        duration: 8000,
        closable: true,
        type: "error",
      });
      console.log(e);
    } finally {
      setIsSyncing(false);
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
            <Icon as={LuDatabase} />
            <Text fontWeight="bold">データ移行</Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            BPIManagerで保存されたスコアをBPIM2へ引き継ぎます。
          </Text>
          <Text fontSize="2xs" color="orange.300">
            BPIM2で登録されたデータをすべて削除し、BPIManagerのスコアに置き換えます。
            <br />
            操作を取り消すことはできません。
          </Text>
        </VStack>

        <Button
          px={2}
          onClick={() => handleOpenConfirm()}
          loading={isSyncing}
          loadingText="同期中..."
          size="md"
          w={{ base: "full", md: "auto" }}
          variant="outline"
        >
          <LuRefreshCw />
          同期
        </Button>
      </Stack>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSyncFirestore}
        title="データの同期と置き換え"
        isDestructive={true}
        isLoading={isSyncing}
        description={
          <VStack align="stretch" gap={4}>
            <Text fontSize="sm">
              BPIManagerで保存されたデータをBPIM2へ移行します。
            </Text>

            <Box
              p={3}
              bg="whiteAlpha.50"
              borderRadius="md"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
            >
              <Text fontSize="xs" fontWeight="bold" mb={2} color="gray.400">
                移行可能なデータ:
              </Text>

              {isChecking ? (
                <HStack gap={2}>
                  <Spinner size="xs" />
                  <Text fontSize="xs">スキャン中...</Text>
                </HStack>
              ) : foundVersions.length > 0 ? (
                <HStack gap={2} wrap="wrap">
                  {foundVersions.map((v) => (
                    <Badge
                      key={v}
                      colorPalette="blue"
                      variant="subtle"
                      px={2}
                      py={0.5}
                    >
                      {versionTitles.find((item) => item.num === String(v))
                        ?.title || `Ver.${v}`}
                    </Badge>
                  ))}
                </HStack>
              ) : (
                <Text fontSize="xs" color="red.400">
                  同期可能なデータが見つからないため、続行できません。
                </Text>
              )}
            </Box>

            <Text fontSize="xs" color="orange.300">
              ※同期を実行すると現在のBPIM2のデータは削除されます。
              <br />
              BPIManagerのデータは引き続きご利用いただけます。
            </Text>

            <Text fontSize="xs" color="red.300">
              処理は最大2~3分かかることがあります。
              <br />
              画面を閉じたり移動しないでそのままお待ち下さい。
            </Text>
          </VStack>
        }
        confirmLabel={foundVersions.length > 0 ? "同期" : "続行できません"}
      />
    </Box>
  );
}
