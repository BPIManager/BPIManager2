import {
  VStack,
  HStack,
  Text,
  Button,
  Separator,
  Center,
} from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import { User, ChevronRight, Activity } from "lucide-react";
import { useRivalComparison } from "@/hooks/social/useRivalComparison";
import Link from "next/link";
import { useProfile } from "@/hooks/users/useProfile";
import { RivalBodySkeleton, RivalHeaderSkeleton } from "./skeleton";
import { RivalHeader, SectionTitle, WinLossStats } from "./ui";
import { RadarSectionChart } from "../../DashBoard/Radar/ui";

export const RivalComparisonModal = ({
  rivalId,
  isOpen,
  onClose,
  viewerRadar,
}: any) => {
  const {
    data,
    isLoading: isRivalLoading,
    isValidating,
  } = useRivalComparison(rivalId);
  const {
    toggleFollow,
    isUpdating,
    profile: profileData,
    isLoading: isProfileLoading,
  } = useProfile(rivalId);

  if (!rivalId) return null;

  const profile = data?.profile || profileData;
  const compare = data?.compare;
  const isLoading = isRivalLoading || isProfileLoading;

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={onClose}
      size="md"
      placement={{ mdDown: "top", md: "center" }}
      motionPreset="slide-in-bottom"
    >
      <DialogContent
        bg="#0a0c10"
        borderRadius="2xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
        boxShadow="0 20px 50px rgba(0,0,0,0.5)"
      >
        <DialogHeader p={6} pb={2}>
          {isLoading ? (
            <RivalHeaderSkeleton />
          ) : (
            <RivalHeader
              profile={profile}
              isUpdating={isUpdating || isValidating}
              onToggleFollow={toggleFollow}
            />
          )}
        </DialogHeader>

        <DialogBody p={6} pt={0}>
          {isLoading ? (
            <RivalBodySkeleton />
          ) : (
            compare && (
              <VStack gap={6} align="stretch">
                <Separator opacity={0.1} />

                <WinLossStats winLossData={compare.winLoss} />

                <VStack align="stretch" gap={3}>
                  <SectionTitle icon={Activity} label="RADAR COMPARISON" />
                  <Center
                    bg="rgba(0,0,0,0.2)"
                    borderRadius="xl"
                    p={4}
                    h={{ base: "250px", md: "300px" }}
                    w="full"
                    border="1px solid"
                    borderColor="whiteAlpha.50"
                  >
                    <RadarSectionChart
                      data={viewerRadar}
                      rivalData={compare.radar}
                      isMini={false}
                    />
                  </Center>
                </VStack>

                <Button
                  asChild
                  variant="solid"
                  bg="blue.600"
                  _hover={{ bg: "blue.500" }}
                  width="full"
                  size="md"
                  borderRadius="xl"
                  height="50px"
                  mt={4}
                >
                  <Link href={`/user/${rivalId}`}>
                    <HStack justify="center" gap={2}>
                      <User size={18} />
                      <Text fontSize="sm" fontWeight="bold">
                        詳細プロフィールを見る
                      </Text>
                      <ChevronRight size={18} />
                    </HStack>
                  </Link>
                </Button>
              </VStack>
            )
          )}
        </DialogBody>
        <DialogCloseTrigger color="white" />
      </DialogContent>
    </DialogRoot>
  );
};
