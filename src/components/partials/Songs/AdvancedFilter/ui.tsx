import { useState, useEffect } from "react";
import {
  Stack,
  Text,
  Input,
  HStack,
  VStack,
  Button,
  Field,
  Separator,
  SimpleGrid,
  Box,
} from "@chakra-ui/react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterParamsFrontend } from "@/types/songs/withScore";
import { verNameArr } from "@/constants/versions";
import { CLEAR_STATES } from "@/constants/lampState";
import dayjs from "@/lib/dayjs";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
}

export const AdvancedFilterModal = ({
  isOpen,
  onClose,
  params,
  onParamsChange,
}: Props) => {
  const [localParams, setLocalParams] = useState<FilterParamsFrontend>(params);

  useEffect(() => {
    if (isOpen) {
      setLocalParams(params);
    }
  }, [isOpen, params]);

  const periodOptions = [
    { label: "今日", value: "today" },
    { label: "昨日", value: "yesterday" },
    { label: "今週", value: "thisWeek" },
    { label: "今月", value: "thisMonth" },
    { label: "直近7日", value: "past7" },
    { label: "直近30日", value: "past30" },
  ];

  const isCustomActive =
    localParams.since &&
    !periodOptions.find((v) => v.value === localParams.since);

  const updateLocal = (val: Partial<FilterParamsFrontend>) => {
    setLocalParams((prev) => ({ ...prev, ...val }));
  };

  const handleApply = () => {
    onParamsChange(localParams);
    onClose();
  };

  const handleReset = () => {
    setLocalParams({
      bpmMin: undefined,
      bpmMax: undefined,
      isSofran: undefined,
      since: undefined,
      until: undefined,
      versions: [],
      clearStates: [],
    });
  };

  const toggleState = (val: string) => {
    const current = localParams.clearStates || [];
    const next = current.includes(val)
      ? current.filter((i) => i !== val)
      : [...current, val];
    updateLocal({ clearStates: next });
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={onClose}
      scrollBehavior="inside"
      size="md"
      placement={{ mdDown: "top", md: "center" }}
    >
      <DialogContent
        bg="gray.950"
        border="1px solid"
        borderColor="gray.800"
        p={4}
      >
        <DialogHeader>
          <DialogTitle fontSize="md" fontWeight="bold">
            詳細フィルター
          </DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />

        <DialogBody py={2}>
          <Stack gap={6}>
            <VStack align="start" gap={3}>
              <Text fontSize="xs" fontWeight="bold" color="blue.500">
                BPM範囲
              </Text>
              <HStack w="full" gap={4}>
                <Input
                  placeholder="Min"
                  type="number"
                  size="sm"
                  variant="subtle"
                  value={localParams.bpmMin ?? ""}
                  onChange={(e) =>
                    updateLocal({
                      bpmMin: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
                <Text color="gray.600">~</Text>
                <Input
                  placeholder="Max"
                  type="number"
                  size="sm"
                  variant="subtle"
                  value={localParams.bpmMax ?? ""}
                  onChange={(e) =>
                    updateLocal({
                      bpmMax: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </HStack>
              <Checkbox
                checked={localParams.isSofran}
                onCheckedChange={(e) => updateLocal({ isSofran: !!e.checked })}
              >
                <Text fontSize="sm">ソフラン曲のみ表示</Text>
              </Checkbox>
            </VStack>

            <Separator opacity={0.1} />

            <VStack align="start" gap={3}>
              <Text fontSize="xs" fontWeight="bold" color="blue.500">
                ランプ状態
              </Text>
              <SimpleGrid columns={2} gap={3} w="full">
                {CLEAR_STATES.map((state) => (
                  <Checkbox
                    key={state.value}
                    checked={localParams.clearStates?.includes(state.value)}
                    onCheckedChange={() => toggleState(state.value)}
                    colorPalette="blue"
                  >
                    <Text fontSize="xs" fontWeight="bold" color={state.color}>
                      {state.label}
                    </Text>
                  </Checkbox>
                ))}
              </SimpleGrid>
            </VStack>

            <Separator opacity={0.1} />

            <VStack align="start" gap={3}>
              <Text fontSize="xs" fontWeight="bold" color="blue.500">
                最終更新日
              </Text>
              <HStack wrap="wrap" gap={2}>
                {periodOptions.map((opt) => (
                  <Button
                    px={2}
                    key={opt.value}
                    size="xs"
                    variant={
                      localParams.since === opt.value ? "solid" : "outline"
                    }
                    colorPalette={
                      localParams.since === opt.value ? "blue" : "gray"
                    }
                    onClick={() =>
                      updateLocal({
                        since:
                          localParams.since === opt.value
                            ? undefined
                            : (opt.value as any),
                        until: undefined,
                      })
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
                <Button
                  size="xs"
                  px={2}
                  variant={isCustomActive ? "solid" : "outline"}
                  colorPalette={isCustomActive ? "blue" : "gray"}
                  onClick={() => {
                    if (isCustomActive) {
                      updateLocal({ since: undefined, until: undefined });
                    } else {
                      const today = dayjs().tz().format("YYYY-MM-DD");
                      updateLocal({ since: today, until: today });
                    }
                  }}
                >
                  カスタム
                </Button>
              </HStack>

              {isCustomActive && (
                <VStack w="full" gap={2} p={3} bg="gray.900" borderRadius="md">
                  <HStack w="full" gap={2}>
                    <Field.Root>
                      <Text fontSize="10px" color="gray.500" mb={1}>
                        開始日
                      </Text>
                      <Input
                        type="date"
                        size="sm"
                        value={localParams.since || ""}
                        onChange={(e) => updateLocal({ since: e.target.value })}
                        css={{
                          "&::-webkit-calendar-picker-indicator": {
                            filter: "invert(1)",
                          },
                        }}
                      />
                    </Field.Root>
                    <Box mt={6} color="gray.600">
                      ~
                    </Box>
                    <Field.Root>
                      <Text fontSize="10px" color="gray.500" mb={1}>
                        終了日
                      </Text>
                      <Input
                        type="date"
                        size="sm"
                        value={localParams.until || ""}
                        onChange={(e) => updateLocal({ until: e.target.value })}
                        css={{
                          "&::-webkit-calendar-picker-indicator": {
                            filter: "invert(1)",
                          },
                        }}
                      />
                    </Field.Root>
                  </HStack>
                </VStack>
              )}
            </VStack>

            <Separator opacity={0.1} />

            <VStack align="start" gap={3} w="full">
              <Text fontSize="xs" fontWeight="bold" color="blue.500">
                楽曲バージョン
              </Text>
              <Box w="full" maxH="200px" overflowY="auto" pr={2}>
                <SimpleGrid columns={2} gap={2}>
                  {verNameArr.map((name, index) => {
                    if (!name) return null;
                    const isChecked = localParams.versions?.includes(index);
                    return (
                      <Checkbox
                        key={index}
                        size="sm"
                        checked={isChecked}
                        onCheckedChange={() => {
                          const current = localParams.versions || [];
                          const next = isChecked
                            ? current.filter((i) => i !== index)
                            : [...current, index];
                          updateLocal({ versions: next });
                        }}
                      >
                        <Text whiteSpace="nowrap">{name}</Text>
                      </Checkbox>
                    );
                  })}
                </SimpleGrid>
              </Box>
            </VStack>
          </Stack>
        </DialogBody>

        <DialogFooter pt={4}>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            リセット
          </Button>
          <Button colorPalette="blue" px={2} size="sm" onClick={handleApply}>
            適用して閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
