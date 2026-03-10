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
} from "@chakra-ui/react";
import { SiX } from "react-icons/si";
import { BpiHistoryTable } from "./bpiTable";
import { FollowSection } from "./followStatus";
import { FollowStats } from "./followCount";

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
      <VStack gap={5} align="center">
        <Avatar.Root
          border="2px solid"
          borderColor="blue.500"
          width="128px"
          height="128px"
        >
          <Avatar.Fallback name={profile.userName} />
          <Avatar.Image src={profile.profileImage} />
        </Avatar.Root>

        <VStack gap={2} textAlign="center">
          <Heading size="md" color="white">
            {profile.userName}
          </Heading>
          <Text fontSize="sm" color="gray.500" fontFamily="mono">
            IIDX ID: {profile.iidxId}
          </Text>
        </VStack>

        <FollowStats userId={profile.userId} follows={profile.follows} />
        <FollowSection
          userId={profile.userId}
          isUpdating={isUpdating}
          relationship={profile.relationship}
          onToggle={onFollowToggle}
        />

        {profile.xId && (
          <Link href={`https://x.com/${profile.xId}`} target="_blank">
            <HStack color="gray.400" _hover={{ color: "blue.400" }} gap={2}>
              <SiX size={14} />
              <Text fontSize="xs">@{profile.xId}</Text>
            </HStack>
          </Link>
        )}

        <Separator borderColor="whiteAlpha.100" />

        <VStack align="stretch" w="full" gap={6}>
          <HStack justify="space-between" align="flex-end">
            <Box>
              <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={1}>
                ARENA RANK
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
              <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={1}>
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
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
            >
              <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={2}>
                BIO
              </Text>
              <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                {profile.profileText}
              </Text>
            </Box>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};
