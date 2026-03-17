import { Circle, Image, Box, HStack, Button } from "@chakra-ui/react";
import { auth } from "@/lib/firebase";

export const AvatarSection = ({
  image,
  onChange,
}: {
  image: string;
  onChange: (url: string) => void;
}) => {
  const useServiceIcon = () => onChange(auth.currentUser?.photoURL || "");
  const useDiceBearIcon = () =>
    onChange(
      `https://api.dicebear.com/9.x/identicon/svg?seed=${Math.random()}`,
    );

  return (
    <HStack gap={4}>
      <Circle
        size="72px"
        overflow="hidden"
        border="2px solid"
        borderColor="blue.500"
      >
        <Image src={image} alt="Preview" />
      </Circle>
      <Box display="flex" flexDirection="column" gap={1}>
        <Button px={2} size="xs" variant="outline" onClick={useServiceIcon}>
          連携サービスを使用
        </Button>
        <Button px={2} size="xs" variant="outline" onClick={useDiceBearIcon}>
          ランダムに設定
        </Button>
      </Box>
    </HStack>
  );
};
