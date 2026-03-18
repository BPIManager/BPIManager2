import {
  SimpleGrid,
  Tabs,
  Spinner,
  Center,
  Text,
  Button,
  VStack,
} from "@chakra-ui/react";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { useFollowList } from "@/hooks/users/useFollowList";
import { useRouter } from "next/router";
import { LuUsers, LuUserCheck } from "react-icons/lu";
import { UserFollowCard } from "./ui";
import { DashCard } from "@/components/ui/chakra/dashcard";

export default function FollowPage({
  type,
}: {
  type: "following" | "followers";
}) {
  const router = useRouter();
  const userId = router.query.userId as string;
  const { users, isLoading, isReachingEnd, loadMore, totalCount } =
    useFollowList(userId, type);

  if (!userId) return null;

  const handleTabChange = (details: { value: string }) => {
    router.push(`/users/${userId}/${details.value}`, undefined, {
      shallow: true,
    });
  };

  return (
    <UserProfileLayout userId={userId} currentTab="">
      <DashCard>
        <Tabs.Root
          value={type}
          onValueChange={handleTabChange}
          colorPalette="blue"
          variant="plain"
        >
          <Tabs.List
            bg="whiteAlpha.50"
            p={1}
            borderRadius="xl"
            mb={6}
            width="full"
          >
            <Tabs.Trigger
              value="following"
              gap={2}
              borderRadius="lg"
              flex={1}
              justifyContent={"center"}
            >
              <LuUserCheck size={14} />
              フォロー
            </Tabs.Trigger>
            <Tabs.Trigger
              value="followers"
              gap={2}
              borderRadius="lg"
              flex={1}
              justifyContent={"center"}
            >
              <LuUsers size={14} />
              フォロワー
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value={type} p={0}>
            {users.length === 0 && !isLoading ? (
              <Center py={10} flexDirection="column" gap={2}>
                <Text color="gray.500">まだ誰もいません</Text>
              </Center>
            ) : (
              <VStack gap={3} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {users.map((user) => (
                    <UserFollowCard key={user.userId} user={user} />
                  ))}
                </SimpleGrid>

                {!isReachingEnd && (
                  <Button
                    onClick={loadMore}
                    loading={isLoading}
                    variant="ghost"
                    color="gray.400"
                    size="sm"
                    mt={4}
                  >
                    さらに読み込む
                  </Button>
                )}
                {isLoading && users.length === 0 && (
                  <Center py={10}>
                    <Spinner color="blue.500" />
                  </Center>
                )}
              </VStack>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </DashCard>
    </UserProfileLayout>
  );
}
