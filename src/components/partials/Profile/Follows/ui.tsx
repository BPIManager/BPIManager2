import { FollowUser } from "@/hooks/users/useFollowList";
import { HStack, VStack, Avatar, Text, Badge, Box } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

export const UserFollowCard = ({ user }: { user: FollowUser }) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(
    user.isViewerFollowing,
  );

  useEffect(() => {
    setIsFollowing(user.isViewerFollowing);
  }, [user.isViewerFollowing]);

  const isMasked = user.userId === "";

  const UserInfo = (
    <HStack gap={4} flex="1">
      <Avatar.Root size="lg">
        <Avatar.Fallback name={user.userName} />
        <Avatar.Image src={user.profileImage ?? ""} />
      </Avatar.Root>
      <VStack align="start" gap={0}>
        <Text fontWeight="bold" color="white" fontSize="sm">
          {user.userName}
        </Text>
        <HStack gap={2}>
          <Badge colorPalette="orange" size="xs" px={1}>
            {user.arenaRank || "N/A"}
          </Badge>
          <Text
            fontSize="xs"
            color="blue.300"
            fontFamily="mono"
            fontWeight="bold"
          >
            総合BPI: {user.totalBpi?.toFixed(2) ?? "N/A"}
          </Text>
        </HStack>
      </VStack>
    </HStack>
  );

  return (
    <HStack
      bg="whiteAlpha.50"
      p={4}
      borderRadius="xl"
      border="1px solid"
      borderColor="whiteAlpha.100"
      justify="space-between"
      _hover={isMasked ? {} : { bg: "whiteAlpha.100" }}
      cursor={isMasked ? "default" : "pointer"}
      transition="background 0.2s"
    >
      {isMasked ? (
        UserInfo
      ) : (
        <NextLink href={`/user/${user.userId}`} style={{ display: "contents" }}>
          {UserInfo}
        </NextLink>
      )}
    </HStack>
  );
};
