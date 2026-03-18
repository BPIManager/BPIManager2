import { FormSelect } from "@/components/ui/chakra/select";
import { versionsNonDisabledCollection } from "@/constants/versions";
import {
  Container,
  VStack,
  Text,
  Heading,
  Box,
  SimpleGrid,
  Separator,
} from "@chakra-ui/react";
import { SongWithScore } from "@/types/songs/withScore";
import { RivalRankingBody } from "./ui";
import { IIDXVersion, latestVersion } from "@/constants/latestVersion";
import { useState } from "react";

export default function RivalsRanking({ song }: { song: SongWithScore }) {
  const [version, setVersion] = useState<string>(latestVersion);

  return (
    <>
      <Box p={4} borderRadius="md" bg="bg.subtle" borderWidth="1px">
        <VStack align="start" gap={2} minW={{ base: "full", lg: "240px" }}>
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            fontWeight="bold"
            color="gray.500"
          >
            VERSION
          </Text>
          <FormSelect
            collection={versionsNonDisabledCollection}
            value={version}
            onValueChange={(e) => setVersion(e)}
            size="xs"
            variant="subtle"
          />
        </VStack>
      </Box>
      <RivalRankingBody songId={song.songId} version={version} myScore={song} />
    </>
  );
}
