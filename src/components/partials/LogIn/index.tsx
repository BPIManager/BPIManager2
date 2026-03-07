"use client";

import { authActions } from "@/lib/firebase/auth";
import { Button, VStack, Text, Group } from "@chakra-ui/react";
import { FaGoogle, FaTwitter, FaLine } from "react-icons/fa";

export const LoginButtons = () => {
  return (
    <VStack
      gap={4}
      width="full"
      maxW="full"
      my={4}
      borderColor="whiteAlpha.200"
      px={4}
      py={4}
      borderRadius="md"
      borderWidth="1px"
    >
      <Text fontSize="sm" color="gray.500">
        ログインして開始
      </Text>

      <Group attached orientation="vertical" width="full">
        <Button
          variant="outline"
          width="full"
          onClick={() => authActions.signInWithGoogle()}
        >
          <FaGoogle />
          Googleでログイン
        </Button>

        <Button
          variant="outline"
          width="full"
          onClick={() => authActions.signInWithTwitter()}
        >
          <FaTwitter />X (Twitter) でログイン
        </Button>

        <Button
          variant="outline"
          width="full"
          onClick={() => authActions.signInWithLINE()}
        >
          <FaLine />
          LINEでログイン
        </Button>
      </Group>
    </VStack>
  );
};
