import { useUser } from "@/contexts/users/UserContext";
import { VStack, Button, HStack, Badge } from "@chakra-ui/react";
import { Check, Plus } from "lucide-react";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogBody,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import { LoginRequiredCard } from "../../LoginRequired/ui";

export const FollowSection = ({
  relationship,
  onToggle,
  isUpdating,
  userId,
  w = "full",
}: {
  relationship: any;
  onToggle?: () => void;
  isUpdating?: boolean;
  userId: string;
  w: any;
}) => {
  const { fbUser } = useUser();
  const isLoggedIn = !!fbUser?.uid;

  if (isLoggedIn && fbUser?.uid === userId) {
    return null;
  }

  const renderButtonContent = () => (
    <>
      {relationship.isFollowing ? <Check size={16} /> : <Plus size={16} />}
      {relationship.isFollowing ? "フォロー中" : "フォローする"}
    </>
  );

  return (
    <>
      {isLoggedIn ? (
        <Button
          width={w}
          px={4}
          size="sm"
          variant="solid"
          colorPalette={relationship.isFollowing ? "green" : "blue"}
          color={relationship.isFollowing ? "black" : "white"}
          onClick={onToggle}
          borderRadius="full"
          fontWeight="bold"
          loading={isUpdating}
        >
          {renderButtonContent()}
        </Button>
      ) : (
        <DialogRoot placement="center">
          <DialogTrigger asChild>
            <Button
              width="full"
              size="sm"
              variant="solid"
              colorPalette="blue"
              color="white"
              borderRadius="full"
              fontWeight="bold"
            >
              {renderButtonContent()}
            </Button>
          </DialogTrigger>
          <DialogContent bg="transparent" border="none" boxShadow="none">
            <DialogBody p={0}>
              <LoginRequiredCard />
            </DialogBody>
            <DialogCloseTrigger color="white" />
          </DialogContent>
        </DialogRoot>
      )}

      <HStack gap={1}>
        {relationship.isMutual ? (
          <Badge variant="subtle" colorPalette="blue" size="sm" px={2}>
            相互フォロー
          </Badge>
        ) : relationship.isFollowedBy ? (
          <Badge variant="subtle" colorPalette="blue" size="sm" px={2}>
            フォローされています
          </Badge>
        ) : null}
      </HStack>
    </>
  );
};
