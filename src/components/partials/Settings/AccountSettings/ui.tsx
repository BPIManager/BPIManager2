import {
  Box,
  VStack,
  Text,
  Button,
  Stack,
  Icon,
  HStack,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { LuRefreshCw, LuDatabase, LuUser } from "react-icons/lu";
import { useUser } from "@/contexts/users/UserContext";
import { useState } from "react";
import { Cog } from "lucide-react";
import AccountSettings from "../../Modal/AccountSettings";

export default function AccountSettingsUi() {
  const { fbUser } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Box
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
            <Icon as={LuUser} />
            <Text fontWeight="bold">プロフィール設定</Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            BPIM2のユーザープロフィールを設定します。
          </Text>
        </VStack>

        <Button
          px={2}
          size="md"
          onClick={() => setIsDialogOpen(true)}
          w={{ base: "full", md: "auto" }}
          variant="outline"
        >
          <Cog />
          開く
        </Button>
      </Stack>
      <AccountSettings
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </Box>
  );
}
