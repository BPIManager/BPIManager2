import { useRouter } from "next/router";
import { VStack, Text } from "@chakra-ui/react";
import { FormSelect } from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { useUser } from "@/contexts/users/UserContext";

interface Props {
  version: string;
}

export const LogVersionSelector = ({ version }: Props) => {
  const router = useRouter();
  const { user } = useUser();

  const handleVersionChange = (details: string) => {
    const nextVersion = details;
    if (!nextVersion) return;

    router.push(`/user/${user?.userId}/logs/${nextVersion}`, undefined, {
      shallow: true,
    });
  };

  return (
    <VStack align="start" gap={2} minW={{ base: "full", lg: "200px" }}>
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
        onValueChange={handleVersionChange}
        size="sm"
        variant="subtle"
      />
    </VStack>
  );
};
