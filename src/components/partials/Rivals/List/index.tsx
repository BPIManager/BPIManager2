import { useState } from "react";
import { VStack } from "@chakra-ui/react";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { RivalFilter } from "./filter";
import { RivalList } from "./container";

export const RivalListContainer = () => {
  const { user } = useUser();
  const [levels, setLevels] = useState<string[]>(["11", "12"]);
  const [difficulties, setDifficulties] = useState<string[]>([
    "HYPER",
    "ANOTHER",
    "LEGGENDARIA",
  ]);

  const { results, isLoading, isError } = useRivalSummary({
    userId: user?.userId || false,
    levels,
    difficulties,
    version: latestVersion,
  });

  const handleToggleLevel = (lv: string) => {
    setLevels((prev) =>
      prev.includes(lv) ? prev.filter((l) => l !== lv) : [...prev, lv],
    );
  };

  const handleToggleDifficulty = (diff: string) => {
    setDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff],
    );
  };

  return (
    <VStack align="stretch" gap={8} w="full">
      <RivalFilter
        levels={levels}
        difficulties={difficulties}
        onToggleLevel={handleToggleLevel}
        onToggleDifficulty={handleToggleDifficulty}
      />
      <RivalList
        results={results || []}
        isLoading={isLoading}
        isError={isError}
        onCardClick={(id) => (window.location.href = `/rivals/${id}`)}
      />
    </VStack>
  );
};

export default RivalListContainer;
