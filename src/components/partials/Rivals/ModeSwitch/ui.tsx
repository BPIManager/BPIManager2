import { HStack, Text, Badge, Button } from "@chakra-ui/react";
import { LuSwords, LuUser, LuChevronRight } from "react-icons/lu";
import NextLink from "next/link";

interface ModeSwitchBannerProps {
  type: "user" | "rival";
  targetUserId: string;
  isMe: boolean;
}

export const ModeSwitchBanner = ({
  type,
  targetUserId,
  isMe,
}: ModeSwitchBannerProps) => {
  if (isMe) return null;

  const isRivalMode = type === "rival";

  return (
    <HStack
      mb={4}
      p={3}
      bg={isRivalMode ? "orange.900/20" : "blue.900/20"}
      border="1px solid"
      borderColor={isRivalMode ? "orange.700/40" : "blue.700/40"}
      borderRadius="lg"
      gap={2}
      wrap="wrap"
    >
      <HStack gap={2} flex="1" minW="fit-content">
        <LuSwords size={16} color={isRivalMode ? "#f97316" : "#3b82f6"} />
        <Text
          fontSize="xs"
          color={isRivalMode ? "orange.300" : "blue.300"}
          fontWeight="bold"
          whiteSpace="nowrap"
        >
          {isRivalMode ? "ライバル比較モード" : "スコアを比較しますか?"}
        </Text>
      </HStack>

      <Button
        asChild
        size="xs"
        variant="outline"
        colorPalette={isRivalMode ? "orange" : "blue"}
        ml={{ base: 0, sm: "auto" }}
        flexShrink={0}
        px={2}
      >
        <NextLink
          href={
            isRivalMode ? `/user/${targetUserId}` : `/rivals/${targetUserId}`
          }
        >
          {isRivalMode ? <LuUser size={14} /> : <LuSwords size={14} />}
          <Text as="span" ml={1}>
            {isRivalMode ? "プロフィールを表示" : "スコア比較モード"}
          </Text>
          <LuChevronRight size={14} />
        </NextLink>
      </Button>
    </HStack>
  );
};
