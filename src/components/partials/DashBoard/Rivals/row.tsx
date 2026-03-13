import {
  Box,
  VStack,
  HStack,
  Avatar,
  Center,
  Text,
  Link as ChakraLink,
} from "@chakra-ui/react";
import Link from "next/link";

export const RivalComparisonRow = ({ rival }: { rival: any }) => {
  const { userName, profileImage, userId } = rival;
  const { win, lose, draw, totalCount } = rival.stats;

  const winRate = (win / totalCount) * 100;
  const drawRate = (draw / totalCount) * 100;
  const loseRate = (lose / totalCount) * 100;

  return (
    <VStack align="stretch" gap={1}>
      <HStack justify="space-between">
        <HStack gap={2}>
          <Avatar.Root size="xs">
            <Avatar.Image src={profileImage} />
            <Avatar.Fallback name={userName} />
          </Avatar.Root>
          <ChakraLink
            asChild
            fontSize="xs"
            fontWeight="bold"
            color="white"
            lineClamp={1}
          >
            <Link href={`/rivals/${userId}`}>{userName}</Link>
          </ChakraLink>
        </HStack>
        <Text fontSize="10px" color="gray.500" fontWeight="bold">
          {totalCount}曲
        </Text>
      </HStack>

      <Box
        position="relative"
        w="full"
        h="18px"
        borderRadius="sm"
        overflow="hidden"
        bg="whiteAlpha.50"
      >
        <HStack gap={0} w="full" h="full">
          <Box
            w={`${winRate}%`}
            h="full"
            bg="blue.500"
            transition="width 1s ease-out"
            position="relative"
          >
            {winRate > 10 && (
              <Center position="absolute" inset={0}>
                <Text fontSize="10px" fontWeight="bold" color="white">
                  {win}
                </Text>
              </Center>
            )}
          </Box>

          <Box
            w={`${drawRate}%`}
            h="full"
            bg="gray.500"
            transition="width 1s ease-out"
            position="relative"
          >
            {drawRate > 15 && (
              <Center position="absolute" inset={0}>
                <Text fontSize="10px" fontWeight="bold" color="white">
                  {draw}
                </Text>
              </Center>
            )}
          </Box>

          <Box
            w={`${loseRate}%`}
            h="full"
            bg="red.500"
            transition="width 1s ease-out"
            position="relative"
          >
            {loseRate > 10 && (
              <Center position="absolute" inset={0}>
                <Text fontSize="10px" fontWeight="bold" color="white">
                  {lose}
                </Text>
              </Center>
            )}
          </Box>
        </HStack>

        {winRate <= 10 && win > 0 && (
          <Text
            position="absolute"
            left="2px"
            top="50%"
            transform="translateY(-50%)"
            fontSize="10px"
            fontWeight="bold"
            color="yellow.400"
            pointerEvents="none"
          >
            {win}
          </Text>
        )}
        {loseRate <= 10 && lose > 0 && (
          <Text
            position="absolute"
            right="2px"
            top="50%"
            transform="translateY(-50%)"
            fontSize="10px"
            fontWeight="bold"
            color="blue.300"
            pointerEvents="none"
          >
            {lose}
          </Text>
        )}
      </Box>
    </VStack>
  );
};
