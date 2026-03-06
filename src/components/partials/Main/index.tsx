import {
  Box,
  Flex,
  IconButton,
  Text,
  HStack,
  Container,
} from "@chakra-ui/react";
import { Menu } from "lucide-react";
import {
  DrawerRoot,
  DrawerContent,
  DrawerBody,
  DrawerActionTrigger,
  DrawerBackdrop,
} from "@/components/ui/drawer";
import { useState } from "react";
import { SidebarContent } from "../Sidebar";

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Flex h="100vh" overflow="hidden" bg="bg.canvas">
      <Box
        hideBelow="md"
        w="280px"
        borderRightWidth="1px"
        borderColor="border.muted"
        bg="bg.panel"
      >
        <SidebarContent />
      </Box>

      <Flex direction="column" flex="1" overflow="hidden">
        <HStack
          as="header"
          h="64px"
          px={4}
          borderBottomWidth="1px"
          borderColor="border.muted"
          bg="bg.panel"
          justify="space-between"
        >
          <HStack gap={4}>
            <IconButton
              hideFrom="md"
              variant="ghost"
              aria-label="Menu"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </IconButton>
            <Text fontWeight="black" fontSize="xl">
              BPIM2
            </Text>
          </HStack>
        </HStack>

        <Box as="main" flex="1" overflowY="auto">
          <Container maxW="full">{children}</Container>
        </Box>
      </Flex>

      <DrawerRoot
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement="start"
      >
        <DrawerBackdrop />
        <DrawerContent bg="bg.panel">
          <DrawerBody p={0}>
            <SidebarContent onClose={() => setOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </Flex>
  );
};
