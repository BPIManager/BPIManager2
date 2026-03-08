import { Center, VStack, Text, Heading, Button, Box } from "@chakra-ui/react";
import { LuLock, LuUserMinus } from "react-icons/lu";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const ProfileErrorState = ({
  type,
}: {
  type: "private" | "notfound" | "error";
}) => {
  const configs = {
    private: {
      title: "非公開のプロフィール",
      desc: "このユーザーはプロフィールを非公開に設定しています。",
      icon: <LuLock size={48} />,
      color: "orange.500",
    },
    notfound: {
      title: "ユーザーが見つかりません",
      desc: "指定されたIDのユーザーは存在しないか、退会した可能性があります。",
      icon: <LuUserMinus size={48} />,
      color: "gray.500",
    },
    error: {
      title: "エラーが発生しました",
      desc: "データの取得中に問題が発生しました。時間をおいて再度お試しください。",
      icon: <AlertTriangle size={48} />,
      color: "red.500",
    },
  };

  const current = configs[type];

  return (
    <Center h="60vh">
      <VStack gap={6} textAlign="center">
        <Box color={current.color} bg="whiteAlpha.50" p={6} borderRadius="full">
          {current.icon}
        </Box>
        <VStack gap={2}>
          <Heading size="lg" color="white">
            {current.title}
          </Heading>
          <Text color="gray.500" maxW="320px">
            {current.desc}
          </Text>
        </VStack>
        <Button asChild variant="outline" size="sm" mt={4} px={2}>
          <Link href="/">トップページへ戻る</Link>
        </Button>
      </VStack>
    </Center>
  );
};
