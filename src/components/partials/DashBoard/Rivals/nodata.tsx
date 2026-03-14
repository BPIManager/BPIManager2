import { VStack, Text, Button, Icon } from "@chakra-ui/react";
import { UserPlus } from "lucide-react";
import Link from "next/link";

export const RivalWinLossSummaryNotFound = () => {
  return (
    <VStack
      p={8}
      gap={4}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      textAlign="center"
    >
      <Icon as={UserPlus} boxSize={10} color="gray.500" />
      <VStack gap={1}>
        <Text fontWeight="bold" color="white">
          比較対象のライバルがいません
        </Text>
        <Text fontSize="xs" color="gray.500">
          実力が近いユーザーをライバルに登録してスコアを比較できます！
        </Text>
      </VStack>
      <Button
        asChild
        colorPalette="yellow"
        variant="surface"
        size="sm"
        mt={2}
        px={2}
      >
        <Link href="/rivals/search">実力が近いユーザーを見る</Link>
      </Button>
    </VStack>
  );
};
