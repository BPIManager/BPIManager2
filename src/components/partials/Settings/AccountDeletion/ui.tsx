import {
  Box,
  VStack,
  Text,
  Button,
  Stack,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { useUser } from "@/contexts/users/UserContext";
import { useState } from "react";
import { Cog, Trash } from "lucide-react";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { LuBadgeX } from "react-icons/lu";

export default function AccountDeletionUi() {
  const { fbUser } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Box
      mt={4}
      p={6}
      bg="gray.900"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "start", md: "center" }}
        gap={6}
      >
        <VStack align="start" gap={1}>
          <HStack color="blue.400">
            <Icon as={LuBadgeX} />
            <Text fontWeight="bold">アカウント削除</Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            BPIM2およびBPIMのアカウントを完全に削除します。
          </Text>
          <Text fontSize="sm" color="gray.400">
            未実装。しばし待たれよ
          </Text>
        </VStack>

        <Button
          px={2}
          size="md"
          onClick={() => setIsDialogOpen(true)}
          w={{ base: "full", md: "auto" }}
          variant="outline"
          bg="red.700"
          disabled
        >
          <Trash />
          確認
        </Button>
      </Stack>
      <AccountSettings
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </Box>
  );
}
