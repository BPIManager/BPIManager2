"use client";

import { useRouter } from "next/router";
import { VStack, Text, Stack, SegmentGroup } from "@chakra-ui/react";
import { FormSelect } from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { SegmentedControl } from "@/components/ui/segmented-control";

interface Props {
  version: string;
  groupedBy: string;
}

export const LogFilterSection = ({ version, groupedBy }: Props) => {
  const router = useRouter();
  const { userId } = router.query;

  const handleVersionChange = (nextVersion: string) => {
    if (!nextVersion) return;
    router.push(
      {
        pathname: `/users/${userId as string}/logs/${nextVersion}`,
        query: { groupedBy },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleGroupChange = (nextGroup: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, groupedBy: nextGroup },
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      gap={{ base: 4, md: 6 }}
      align={{ base: "stretch", md: "flex-end" }}
      w="full"
    >
      <VStack align="start" gap={1.5} minW={{ base: "full", md: "240px" }}>
        <Text
          fontSize="2xs"
          fontWeight="bold"
          color="gray.500"
          letterSpacing="widest"
        >
          VERSION
        </Text>
        <FormSelect
          collection={versionsNonDisabledCollection}
          value={version}
          onValueChange={(details) => handleVersionChange(details)}
          size="sm"
          variant="subtle"
        />
      </VStack>

      <VStack align="start" gap={1.5} flex={{ md: "1" }} maxW={{ md: "400px" }}>
        <Text
          fontSize="2xs"
          fontWeight="bold"
          color="gray.500"
          letterSpacing="widest"
        >
          GROUP BY
        </Text>
        <SegmentedControl
          items={[
            { value: "lastPlayed", label: "プレイ日単位" },
            { value: "createdAt", label: "インポート日単位" },
          ]}
          value={groupedBy}
          onValueChange={(e) => handleGroupChange(e.value as string)}
          size="sm"
          h="8"
          w="full"
          bg="bg.subtle"
          borderRadius="md"
        />
      </VStack>
    </Stack>
  );
};
