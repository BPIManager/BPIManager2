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

  const winPct = (win / totalCount) * 100;
  const drawPct = (draw / totalCount) * 100;
  const losePct = (lose / totalCount) * 100;

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
            <Link href={`/user/${userId}`}>{userName}</Link>
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
            w={`${winPct}%`}
            h="full"
            bg="yellow.400"
            transition="width 1s ease-out"
            position="relative"
          >
            {winPct > 10 && (
              <Center position="absolute" inset={0}>
                <Text fontSize="10px" fontWeight="bold" color="black">
                  {win}
                </Text>
              </Center>
            )}
          </Box>

          <Box
            w={`${drawPct}%`}
            h="full"
            bg="gray.600"
            transition="width 1s ease-out"
            position="relative"
          >
            {drawPct > 15 && (
              <Center position="absolute" inset={0}>
                <Text fontSize="10px" fontWeight="bold" color="whiteAlpha.800">
                  {draw}
                </Text>
              </Center>
            )}
          </Box>

          <Box
            w={`${losePct}%`}
            h="full"
            bg="blue.500"
            transition="width 1s ease-out"
            position="relative"
          >
            {losePct > 10 && (
              <Center position="absolute" inset={0}>
                <Text fontSize="10px" fontWeight="bold" color="white">
                  {lose}
                </Text>
              </Center>
            )}
          </Box>
        </HStack>

        {winPct <= 10 && win > 0 && (
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
        {losePct <= 10 && lose > 0 && (
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
