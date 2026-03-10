import { HStack, Link, VStack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export const FollowStats = ({
  userId,
  follows,
}: {
  userId: string;
  follows: any;
}) => (
  <HStack gap={6} justify="center" w="full" py={2}>
    <Link asChild>
      <NextLink href={`/user/${userId}/following`}>
        <VStack gap={0}>
          <Text fontWeight="bold" fontSize="md" color="white" fontFamily="mono">
            {follows.following}
          </Text>
          <Text fontSize="xs" color="gray.500">
            フォロー
          </Text>
        </VStack>
      </NextLink>
    </Link>
    <Link asChild>
      <NextLink href={`/user/${userId}/followers`}>
        <VStack gap={0}>
          <Text fontWeight="bold" fontSize="md" color="white" fontFamily="mono">
            {follows.follower}
          </Text>
          <Text fontSize="xs" color="gray.500">
            フォロワー
          </Text>
        </VStack>
      </NextLink>
    </Link>
  </HStack>
);
