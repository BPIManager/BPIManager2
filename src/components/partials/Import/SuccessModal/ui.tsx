import { useEffect, useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
} from "@chakra-ui/react";
import {
  ScrollText,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useRouter } from "next/router";
import Fireworks from "react-canvas-confetti/dist/presets/fireworks";
import Lottie from "lottie-react";
import trendingUpAnimation from "@/assets/lottie/trending-up.json";

interface Props {
  result: {
    batchId: string;
    updatedCount: number;
    newTotalBpi?: number;
    previousTotalBpi?: number;
  } | null;
  version: string;
  onClose: () => void;
}

export const ImportSuccessModal = ({ result, version, onClose }: Props) => {
  const router = useRouter();
  const { fbUser } = useUser();
  const [displayBpi, setDisplayBpi] = useState(0);

  useEffect(() => {
    if (result?.newTotalBpi) {
      const end = result.newTotalBpi;
      const duration = 1000;
      const startTime = performance.now();

      const updateCount = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeInOutCubic = (t: number) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const currentValue = end * easeInOutCubic(progress);

        setDisplayBpi(currentValue);
        if (progress < 1) requestAnimationFrame(updateCount);
      };
      requestAnimationFrame(updateCount);
    }
  }, [result?.newTotalBpi]);

  if (!result) return null;

  const bpiDiff = (result.newTotalBpi || 0) - (result.previousTotalBpi || 0);
  const isImproved = true || bpiDiff > 0;
  const isUnchanged = bpiDiff === 0;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.800"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="1000"
    >
      {isImproved && (
        <Fireworks
          autorun={{ speed: 2, duration: 1500 }}
          style={{
            position: "fixed",
            width: "100%",
            height: "100%",
            zIndex: 1001,
            pointerEvents: "none",
          }}
        />
      )}

      <Box
        bg="#16181c"
        p={8}
        borderRadius="md"
        border="1px solid"
        borderColor="whiteAlpha.100"
        maxW="400px"
        w="90%"
        textAlign="center"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        position="relative"
        zIndex="1002"
      >
        <VStack gap={7}>
          <Box bg="blue.500/10" p={4} borderRadius="full" color="blue.400">
            {isImproved ? (
              <Lottie
                animationData={trendingUpAnimation}
                loop={false}
                autoplay={true}
                style={{ width: "48px", height: "48px" }}
              />
            ) : (
              <ScrollText size={32} />
            )}
          </Box>

          <VStack gap={1}>
            <Heading size="md" color="white" fontWeight="bold">
              インポート完了
            </Heading>
            <Text fontSize="sm" color="gray.400">
              {result.updatedCount} 件のスコアを更新しました
            </Text>
          </VStack>

          {result.newTotalBpi !== undefined && (
            <VStack gap={4} w="full" py={2}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                letterSpacing="widest"
              >
                総合BPIの推移(☆12)
              </Text>

              <HStack gap={6} alignItems="center" justifyContent="center">
                {result.previousTotalBpi !== undefined && (
                  <Text fontSize="xl" color="gray.600" fontWeight="bold">
                    {result.previousTotalBpi.toFixed(2)}
                  </Text>
                )}

                <ChevronRight size={20} className="text-gray-800" />

                <Text
                  fontSize="4xl"
                  fontWeight="900"
                  color="white"
                  fontVariantNumeric="tabular-nums"
                  lineHeight="1"
                >
                  {displayBpi.toFixed(2)}
                </Text>
              </HStack>

              <Badge
                display="flex"
                alignItems="center"
                gap={1.5}
                px={4}
                py={1.5}
                mt={2}
                borderRadius="full"
                variant="subtle"
                colorPalette={
                  isImproved ? "green" : isUnchanged ? "gray" : "red"
                }
                bg={
                  isImproved
                    ? "green.500/10"
                    : isUnchanged
                      ? "gray.500/10"
                      : "red.500/10"
                }
                border="1px solid"
                borderColor={
                  isImproved
                    ? "green.500/20"
                    : isUnchanged
                      ? "gray.500/20"
                      : "red.500/20"
                }
              >
                {isImproved ? (
                  <TrendingUp size={14} />
                ) : isUnchanged ? (
                  <Minus size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <Text fontSize="xs" fontWeight="bold" letterSpacing="widest">
                  {isImproved ? "上昇" : isUnchanged ? "変動なし" : "低下"} :{" "}
                  {bpiDiff > 0 ? "+" : ""}
                  {bpiDiff.toFixed(2)}
                </Text>
              </Badge>
            </VStack>
          )}

          <VStack w="full" gap={3}>
            <Button
              bg="blue.600"
              _hover={{ bg: "blue.500" }}
              color="white"
              w="full"
              py={4}
              fontSize="md"
              fontWeight="bold"
              onClick={() =>
                router.push(
                  `/users/${fbUser?.uid}/logs/${version}/${result.batchId}`,
                )
              }
            >
              今回の更新ログを確認
            </Button>

            <Button
              variant="outline"
              w="full"
              py={4}
              mt={1}
              color="gray.400"
              borderColor="whiteAlpha.200"
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
              onClick={() => router.push("/my")}
            >
              全スコア一覧を表示
            </Button>

            <Button variant="ghost" color="gray.400" onClick={onClose}>
              閉じる
            </Button>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};
