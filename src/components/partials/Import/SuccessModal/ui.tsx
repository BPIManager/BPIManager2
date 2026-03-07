import {
  Box,
  VStack,
  Heading,
  Text,
  Separator,
  Button,
} from "@chakra-ui/react";
import { ScrollText } from "lucide-react";
import { useRouter } from "next/router";

interface Props {
  result: { batchId: string; updatedCount: number } | null;
  version: string;
  onClose: () => void;
}

export const ImportSuccessModal = ({ result, version, onClose }: Props) => {
  const router = useRouter();
  if (!result) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.700"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="1000"
    >
      <Box
        bg="gray.900"
        p={8}
        borderRadius="2xl"
        border="1px solid"
        borderColor="blue.500/30"
        maxW="400px"
        w="90%"
        textAlign="center"
        boxShadow="2xl"
      >
        <VStack gap={4}>
          <Box bg="blue.500/20" p={4} borderRadius="full" color="blue.400">
            <ScrollText size={32} />
          </Box>
          <VStack gap={1}>
            <Heading size="md">インポート完了！</Heading>
            <Text fontSize="sm" color="gray.400">
              {result.updatedCount} 件のスコアを更新しました。
            </Text>
          </VStack>
          <Separator opacity={0.1} my={2} />
          <VStack w="full" gap={3}>
            <Button
              colorPalette="blue"
              w="full"
              onClick={() => router.push(`/logs/${version}/${result.batchId}`)}
            >
              今回の更新ログを確認する
            </Button>
            <Button
              variant="outline"
              w="full"
              onClick={() => router.push("/my")}
            >
              全スコア一覧を表示
            </Button>
            <Button
              variant="ghost"
              size="xs"
              color="gray.500"
              onClick={onClose}
            >
              閉じる
            </Button>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};
