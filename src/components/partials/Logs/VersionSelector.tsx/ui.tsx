import { useRouter } from "next/router";
import { VStack, Text } from "@chakra-ui/react";
import { FormSelect } from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/versions";

interface Props {
  version: string;
}

export const LogVersionSelector = ({ version }: Props) => {
  const router = useRouter();

  const handleVersionChange = (details: string) => {
    const nextVersion = details;
    if (!nextVersion) return;

    router.push(`/logs/${nextVersion}`, undefined, { shallow: true });
  };

  return (
    <VStack align="start" gap={2} minW={{ base: "full", lg: "200px" }}>
      <Text
        fontSize="2xs"
        fontWeight="black"
        color="gray.500"
        letterSpacing="widest"
      >
        VERSION
      </Text>
      <FormSelect
        collection={versionsNonDisabledCollection}
        value={version}
        onValueChange={handleVersionChange}
        size="sm"
        variant="subtle"
      />
    </VStack>
  );
};
