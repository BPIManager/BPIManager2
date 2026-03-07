import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  AbsoluteCenter,
} from "@chakra-ui/react";
import { LuLock } from "react-icons/lu";
import { LoginButtons } from "../LogIn";

export const LoginRequiredCard = () => {
  return (
    <Box
      p={4}
      bg="gray.900"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      textAlign="center"
      position="relative"
      overflow="hidden"
    >
      <Icon
        as={LuLock}
        position="absolute"
        top="-10px"
        right="-10px"
        fontSize="100px"
        color="whiteAlpha.50"
        transform="rotate(15deg)"
      />

      <VStack gap={4} position="relative" zIndex={1}>
        <Box
          p={3}
          bg="blue.500/10"
          color="blue.400"
          borderRadius="full"
          borderWidth="1px"
          borderColor="blue.500/20"
        >
          <LuLock size={32} />
        </Box>

        <VStack gap={1} width="full">
          <Text fontWeight="bold" fontSize="lg" color="white">
            ログインが必要です
          </Text>
          <Text fontSize="sm" color="gray.400">
            このコンテンツの利用には、BPIMアカウントへのログインが必要です。
          </Text>
        </VStack>

        <LoginButtons />
      </VStack>
    </Box>
  );
};

export const LoginRequiredBox = () => {
  return (
    <>
      <Box
        position="absolute"
        inset={0}
        bg="blackAlpha.400"
        backdropFilter="blur(10px)"
        zIndex={10}
      />
      <AbsoluteCenter zIndex={20} w="full" maxW="full" px={4}>
        <LoginRequiredCard />
      </AbsoluteCenter>
    </>
  );
};
