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
  For,
  Center,
  Grid,
  Button,
} from "@chakra-ui/react";
import { SiX } from "react-icons/si";

export const ProfileSideBar = ({
  profile,
  onFollowToggle,
}: {
  profile: any;
  onFollowToggle?: () => void;
}) => {
  const current = profile.current || {};
  const { follows, relationship } = profile;

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
          <VStack gap={0}>
            <Heading size="md" color="white">
              {profile.userName}
            </Heading>
          </VStack>

          <Text fontSize="sm" color="gray.500" fontFamily="mono">
            IIDX ID: {profile.iidxId}
          </Text>
        </VStack>

        <HStack gap={6} justify="center" w="full" py={2}>
          <Link href={`/user/${profile.userId}/following`}>
            <VStack gap={0}>
              <Text
                fontWeight="bold"
                fontSize="md"
                color="white"
                fontFamily="mono"
              >
                {follows.following}
              </Text>
              <Text fontSize="xs" color="gray.500">
                フォロー
              </Text>
            </VStack>
          </Link>
          <Link href={`/user/${profile.userId}/follower`}>
            <VStack gap={0}>
              <Text
                fontWeight="bold"
                fontSize="md"
                color="white"
                fontFamily="mono"
              >
                {follows.follower}
              </Text>
              <Text fontSize="xs" color="gray.500">
                フォロワー
              </Text>
            </VStack>
          </Link>
        </HStack>

        <Button
          width="full"
          size="sm"
          variant={relationship.isFollowing ? "outline" : "solid"}
          colorPalette={relationship.isFollowing ? "gray" : "blue"}
          onClick={onFollowToggle}
          borderRadius="full"
          fontWeight="bold"
        >
          {relationship.isFollowing ? "フォロー解除" : "フォローする"}
        </Button>
        <HStack gap={1} mt={1}>
          {relationship.isMutual ? (
            <Badge variant="subtle" colorPalette="blue" size="sm" px={2}>
              相互フォロー
            </Badge>
          ) : relationship.isFollowedBy ? (
            <Badge variant="subtle" colorPalette="blue" size="sm" px={2}>
              フォローされています
            </Badge>
          ) : null}
        </HStack>

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
          {/* ARENA/BPI表示エリア */}
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
                fontWeight="black"
                color="blue.300"
                fontFamily="mono"
                lineHeight="1"
              >
                {current.totalBpi?.toFixed(2) ?? "N/A"}
              </Text>
            </Box>
          </HStack>

          {/* 履歴テーブル */}
          <Box>
            <VStack gap={1} align="stretch">
              <Grid
                templateColumns="1fr 2fr 2fr"
                gap={3}
                px={4}
                py={1}
                fontSize="9px"
                color="gray.600"
                fontWeight="black"
                textTransform="uppercase"
              >
                <Text>Ver</Text>
                <Text textAlign="center">Arena</Text>
                <Text textAlign="right">Total BPI</Text>
              </Grid>

              <VStack gap={1} align="stretch">
                <For each={profile.history}>
                  {(hist: any) => (
                    <Grid
                      key={hist.version}
                      templateColumns="1fr 2fr 2fr"
                      gap={3}
                      alignItems="center"
                      fontSize="xs"
                      p={2}
                      px={4}
                      bg="whiteAlpha.50"
                      borderRadius="md"
                      _hover={{ bg: "whiteAlpha.100" }}
                    >
                      <Text
                        fontWeight="bold"
                        color="gray.400"
                        fontFamily="mono"
                      >
                        {hist.version}
                      </Text>
                      <Center>
                        {hist.arenaRank !== "N/A" ? (
                          <Badge
                            size="sm"
                            variant="subtle"
                            colorPalette="gray"
                            fontSize="9px"
                          >
                            {hist.arenaRank}
                          </Badge>
                        ) : (
                          <Text color="gray.700">-</Text>
                        )}
                      </Center>
                      <Text
                        fontFamily="mono"
                        color="blue.200"
                        fontWeight="bold"
                        textAlign="right"
                      >
                        {hist.totalBpi?.toFixed(2)}
                      </Text>
                    </Grid>
                  )}
                </For>
              </VStack>
            </VStack>
          </Box>

          {/* 自己紹介 */}
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
