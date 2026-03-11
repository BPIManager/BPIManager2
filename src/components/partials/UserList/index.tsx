import {
  VStack,
  SimpleGrid,
  Box,
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useUserList } from "@/hooks/users/useUserList";
import { UserRecommendationCard } from "./Card/ui";
import { useRouter } from "next/router";
import { SortSelector } from "./Filter/sortInput";
import { SearchInput } from "./Filter/searchInput";
import { Pagination } from "./pagination";
import { UserRecommendationCardSkeleton } from "./Card/skeleton";
import { UserRecommendationEmpty } from "./Card/empty";
import { useState } from "react";
import { RivalComparisonModal } from "./Modal";

export const UserRecommendationList = () => {
  const router = useRouter();
  const { open, onOpen, onClose } = useDisclosure();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const q = (router.query.q as string) || "";
  const p = Number(router.query.p) || 1;
  const s = (router.query.s as string) || "totalBpi";
  const o = (router.query.o as string) || "distance";

  const updateParams = (newParams: {
    q?: string;
    p?: number;
    s?: string;
    o?: string;
  }) => {
    router.push(
      { pathname: router.pathname, query: { ...router.query, ...newParams } },
      undefined,
      { shallow: true },
    );
  };

  const { data, isLoading } = useUserList(q, p, s, o);
  const handleReset = () =>
    updateParams({ q: "", p: 1, s: "totalBpi", o: "distance" });
  const handleCardClick = (userId: string) => {
    setSelectedUserId(userId);
    onOpen();
  };

  return (
    <VStack align="stretch" gap={6} w="full">
      <Box
        p={4}
        bg="rgba(13, 17, 23, 0.4)"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
      >
        <SortSelector
          sort={s}
          order={o}
          onChange={(val) => {
            const [sort, order] = val.split("_");
            updateParams({ s: sort, o: order, p: 1 });
          }}
        />
        <HStack gap={4}>
          <SearchInput
            initialValue={q}
            onSearch={(val) => updateParams({ q: val, p: 1 })}
          />
        </HStack>
      </Box>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} w="full">
          {Array.from({ length: 10 }).map((_, i) => (
            <UserRecommendationCardSkeleton key={i} />
          ))}
        </SimpleGrid>
      ) : data?.users.length === 0 ? (
        <UserRecommendationEmpty onReset={handleReset} />
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} w="full">
          {data?.users.map((user) => (
            <UserRecommendationCard
              key={user.userId}
              user={user}
              viewerRadar={data.viewer.radar}
              viewerTotalBpi={data.viewer.totalBpi}
              currentSort={s}
              onClick={() => handleCardClick(user.userId)}
            />
          ))}
        </SimpleGrid>
      )}
      {selectedUserId && (
        <RivalComparisonModal
          rivalId={selectedUserId}
          isOpen={open}
          onClose={onClose}
          viewerRadar={data?.viewer.radar}
        />
      )}
      {!isLoading && (
        <Pagination
          p={p}
          hasMore={!!data && data.users.length === 20}
          onPageChange={(next) => updateParams({ p: next })}
        />
      )}
    </VStack>
  );
};
