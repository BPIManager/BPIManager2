import {
  Box,
  VStack,
  Avatar,
  Text,
  Heading,
  Badge,
  Link,
  HStack,
  Separator,
  Flex,
} from "@chakra-ui/react";
import { SiX } from "react-icons/si";
import { BpiHistoryTable } from "./bpiTable";
import { FollowSection } from "./followStatus";
import { FollowStats } from "./followCount";
import { formatIIDXId } from "@/utils/common/formatIidxId";

export const ProfileSideBar = ({
  profile,
  onFollowToggle,
  isUpdating = false,
}: {
  profile: any;
  onFollowToggle?: () => void;
  isUpdating?: boolean;
}) => {
  const current = profile.current || {};

  return (
    <Box
      bg="#0d1117"
      p={6}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      position={{ lg: "sticky" }}
      top="20px"
    >
      <ProfileHeaderBase profile={profile} />

      <FollowStats userId={profile.userId} follows={profile.follows} />
      <Box my={4}>
        <FollowSection
          w="full"
          userId={profile.userId}
          isUpdating={isUpdating}
          relationship={profile.relationship}
          onToggle={onFollowToggle}
        />
      </Box>

      {profile.xId && (
        <Flex justify={"center"} my={4}>
          <Link href={`https://x.com/${profile.xId}`} target="_blank">
            <HStack color="gray.400" _hover={{ color: "blue.400" }} gap={2}>
              <SiX size={14} />
              <Text fontSize="xs">@{profile.xId}</Text>
            </HStack>
          </Link>
        </Flex>
      )}

      <Separator borderColor="whiteAlpha.100" />

      <ProfileStatsContent profile={profile} />
    </Box>
  );
};

export const ProfileHeaderBase = ({ profile }: { profile: any }) => (
  <VStack gap={4} textAlign="center" w="full">
    <Avatar.Root
      border="2px solid"
      borderColor="blue.500"
      width="110px"
      height="110px"
    >
      <Avatar.Fallback name={profile.userName} />
      <Avatar.Image src={profile.profileImage} />
    </Avatar.Root>

    <VStack gap={1}>
      <Heading size="md" color="white" letterSpacing="tight">
        {profile.userName}
      </Heading>
      <Text fontSize="xs" color="gray.500" fontFamily="mono">
        ID: {formatIIDXId(profile.iidxId)}
      </Text>
    </VStack>
  </VStack>
);

export const ProfileStatsContent = ({ profile }: { profile: any }) => {
  const current = profile.current || {};
  return (
    <VStack align="stretch" w="full" gap={6}>
      <HStack justify="space-between" align="flex-end" mt={2}>
        <Box>
          <Text fontSize="10px" color="gray.400" fontWeight="bold" mb={1}>
            ARENA
          </Text>
          <Badge
            colorPalette="orange"
            variant="solid"
            fontSize="md"
            px={3}
            borderRadius="full"
          >
            {current.arenaRank || "N/A"}
          </Badge>
        </Box>
        <Box textAlign="right">
          <Text fontSize="10px" color="gray.400" fontWeight="bold" mb={1}>
            TOTAL BPI
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="blue.300"
            fontFamily="mono"
            lineHeight="1"
          >
            {current.totalBpi?.toFixed(2) ?? "N/A"}
          </Text>
        </Box>
      </HStack>

      <BpiHistoryTable history={profile.history} totalSongCount={606} />

      {profile.profileText && (
        <Box
          bg="whiteAlpha.50"
          p={3}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="whiteAlpha.50"
        >
          <Text fontSize="10px" color="gray.400" fontWeight="bold" mb={2}>
            BIO
          </Text>
          <Text fontSize="xs" color="gray.300" whiteSpace="pre-wrap">
            {profile.profileText}
          </Text>
        </Box>
      )}
    </VStack>
  );
};
