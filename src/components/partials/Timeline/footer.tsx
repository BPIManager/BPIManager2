import { Center, Text } from "@chakra-ui/react";

export const TimelineStatusFooter = ({
  isEmpty,
  isEnd,
}: {
  isEmpty: boolean;
  isEnd: boolean;
}) => {
  if (isEmpty) {
    return (
      <Center py={10} flexDirection="column" gap={2}>
        <Text color="gray.500" fontSize="sm">
          アクティビティが見つかりませんでした。
        </Text>
        <Text color="gray.600" fontSize="xs">
          フィルター条件を変えてみてください
        </Text>
      </Center>
    );
  }
  if (isEnd) {
    return (
      <Center py={8} borderTop="1px solid" borderColor="whiteAlpha.50">
        <Text fontSize="xs" color="whiteAlpha.400" fontWeight="bold">
          これ以上のアクティビティはありません
        </Text>
      </Center>
    );
  }
  return null;
};
