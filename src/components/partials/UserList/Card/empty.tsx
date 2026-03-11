import { VStack, Center, Text, Icon, Button } from "@chakra-ui/react";
import { LuSearchX, LuRefreshCcw } from "react-icons/lu";

interface Props {
  onReset: () => void;
}

export const UserRecommendationEmpty = ({ onReset }: Props) => {
  return (
    <Center
      py={8}
      flexDirection="column"
      bg="rgba(13, 17, 23, 0.2)"
      borderRadius="2xl"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="whiteAlpha.200"
      w="full"
    >
      <VStack gap={4}>
        <Icon as={LuSearchX} boxSize={12} color="gray.600" />
        <VStack gap={1}>
          <Text fontWeight="bold" fontSize="lg" color="white">
            ユーザーが見つかりませんでした
          </Text>
          <Text fontSize="sm" color="gray.500">
            検索ワードを短くするか、ソート条件を変えてみてください。
          </Text>
        </VStack>
        <Button size="sm" variant="ghost" colorPalette="blue" onClick={onReset}>
          <LuRefreshCcw style={{ marginRight: "8px" }} />
          条件をリセット
        </Button>
      </VStack>
    </Center>
  );
};
