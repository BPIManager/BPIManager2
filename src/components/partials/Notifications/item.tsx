import { Box, HStack, VStack, Text, Avatar, Badge } from "@chakra-ui/react";
import Link from "next/link";
import dayjs from "@/lib/dayjs";
import { NotificationItem as NotificationItemType } from "@/hooks/users/useNotifications";

export const NotificationItem = ({ n }: { n: NotificationItemType }) => {
  const isOvertaken = n.type === "overtaken";
  const diff = (n.rivalScore || 0) - (n.myScore || 0);

  return (
    <Link href={`/users/${n.senderId}`} passHref>
      <HStack
        p={3}
        gap={3}
        borderBottomWidth="1px"
        borderColor="whiteAlpha.100"
        _hover={{ bg: "whiteAlpha.50" }}
        _last={{ borderBottomWidth: 0 }}
      >
        <Avatar.Root size="sm">
          <Avatar.Image src={n.senderImage ?? ""} />
          <Avatar.Fallback name={n.senderName} />
        </Avatar.Root>

        <VStack align="start" gap={0} flex="1">
          <Text fontSize="xs" color="gray.500">
            {dayjs(n.timestamp).fromNow()}
          </Text>

          <Box fontSize="sm" color="white">
            <Box as="span" fontWeight="bold">
              {n.senderName}
            </Box>
            {isOvertaken ? (
              <>
                {" "}
                さんが{" "}
                <Box as="span" fontWeight="bold">
                  {n.songTitle}[
                  {(n.songDifficulty || "").slice(0, 1).toUpperCase()}]
                </Box>{" "}
                であなたを上回りました
                <Box color="blue.300" mt={1}>
                  あなた:{n.myScore || 0} ライバル:{n.rivalScore || 0}
                  <Badge
                    bgColor="red.600"
                    color="white"
                    px={2}
                    ml={2}
                    variant="solid"
                  >
                    -{diff}
                  </Badge>
                </Box>
              </>
            ) : (
              " さんにフォローされました"
            )}
          </Box>
        </VStack>
      </HStack>
    </Link>
  );
};
