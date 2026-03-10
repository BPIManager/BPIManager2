import { VStack, SimpleGrid, Spinner, Center } from "@chakra-ui/react";
import { useUserList } from "@/hooks/users/useUserList";
import { UserRecommendationCard } from "./ui";

export const UserRecommendationList = () => {
  const { data, isLoading } = useUserList();

  if (isLoading)
    return (
      <Center py={10}>
        <Spinner color="blue.500" />
      </Center>
    );
  if (!data) return null;

  return (
    <VStack align="stretch" gap={4} w="full">
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        {data.users.map((user) => (
          <UserRecommendationCard
            key={user.userId}
            user={user}
            viewerRadar={data.viewer.radar}
            viewerTotalBpi={data.viewer.totalBpi}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};
