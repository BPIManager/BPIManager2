import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  Text,
  Button,
  Icon,
  Separator,
} from "@chakra-ui/react";
import { useState } from "react";
import { TimelineList } from "./ui";
import { Difficulties, FilterParamsFrontend } from "@/types/songs/withScore";
import { Activity, Swords, UserCheck } from "lucide-react";
import { FilterCheckboxGroup, FilterSearchInput } from "../Songs/Filter/part";
import { useUser } from "@/contexts/users/UserContext";
import { LoginRequiredCard } from "../LoginRequired/ui";

export const TimelineContainer = () => {
  const { user, isLoading } = useUser();
  const [mode, setMode] = useState<"all" | "played" | "overtaken">("all");

  const [filterParams, setFilterParams] = useState<FilterParamsFrontend>({
    levels: [11, 12],
    difficulties: ["HYPER", "ANOTHER", "LEGGENDARIA"],
    search: "",
  });

  const updateParams = (newParams: Partial<FilterParamsFrontend>) => {
    setFilterParams((prev) => ({ ...prev, ...newParams }));
  };

  const toggleArrayItem = <T,>(current: T[] | undefined, item: T) => {
    const list = current || [];
    return list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
  };

  if (!user && !isLoading) {
    return <LoginRequiredCard />;
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Grid
        templateColumns={{ base: "1fr", lg: "260px 1fr" }}
        gap={8}
        alignItems="start"
      >
        <GridItem
          position={{ base: "static", lg: "sticky" }}
          top="80px"
          zIndex={10}
        >
          <VStack
            align="stretch"
            gap={6}
            bg="rgba(13, 17, 23, 0.4)"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
          >
            <VStack align="stretch" gap={1}>
              <FilterHeader label="表示モード" />
              <MenuButton
                isActive={mode === "all"}
                icon={Activity}
                label="すべて"
                onClick={() => setMode("all")}
              />
              <MenuButton
                isActive={mode === "played"}
                icon={UserCheck}
                label="自分がプレイ済み"
                onClick={() => setMode("played")}
              />
              <MenuButton
                isActive={mode === "overtaken"}
                icon={Swords}
                label="逆転された曲"
                colorScheme="red"
                onClick={() => setMode("overtaken")}
              />
            </VStack>

            <FilterCheckboxGroup
              label="LEVEL"
              items={[11, 12]}
              selected={filterParams.levels || []}
              onToggle={(lv: number) =>
                updateParams({
                  levels: toggleArrayItem(filterParams.levels, lv),
                })
              }
              getLabel={(lv: number) => `☆${lv}`}
            />

            <FilterCheckboxGroup
              label="DIFFICULTY"
              items={["HYPER", "ANOTHER", "LEGGENDARIA"]}
              selected={filterParams.difficulties || []}
              onToggle={(diff: Difficulties) =>
                updateParams({
                  difficulties: toggleArrayItem(
                    filterParams.difficulties,
                    diff,
                  ),
                })
              }
              getLabel={(diff: string) => diff[0]}
            />
          </VStack>
        </GridItem>

        <GridItem minW={0}>
          <VStack align="stretch" gap={4}>
            <Box
              bg="gray.950"
              p={2}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
            >
              <FilterSearchInput
                value={filterParams.search || ""}
                onChange={(search: string) => updateParams({ search })}
                placeholder="プレイヤー名または楽曲名で絞り込み..."
              />
            </Box>

            <TimelineList mode={mode} params={filterParams} />
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
};

const FilterHeader = ({ label }: { label: string }) => (
  <Text
    px={1}
    fontSize="10px"
    fontWeight="bold"
    color="gray.500"
    letterSpacing="widest"
    textTransform="uppercase"
    mb={1}
  >
    {label}
  </Text>
);

const MenuButton = ({
  isActive,
  icon,
  label,
  onClick,
  colorScheme = "blue",
}: any) => (
  <Button
    variant={isActive ? "subtle" : "ghost"}
    colorPalette={isActive ? colorScheme : "gray"}
    justifyContent="flex-start"
    size="sm"
    gap={3}
    onClick={onClick}
    px={3}
    _hover={{ bg: "whiteAlpha.100" }}
  >
    <Icon as={icon} size="md" />
    <Text fontSize="xs" fontWeight="bold">
      {label}
    </Text>
  </Button>
);
