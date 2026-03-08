import { iidxUrl } from "@/constants/iidxUrl";
import { HStack, Box, List, Link, Text } from "@chakra-ui/react";
import { HelpCircle } from "lucide-react";

export const InstructionSection = () => (
  <Box
    p={5}
    borderRadius="xl"
    bg="blue.900/10"
    border="1px solid"
    borderColor="blue.500/20"
  >
    <HStack gap={3} mb={3}>
      <HelpCircle size={20} color="var(--chakra-colors-blue-500)" />
      <Text fontWeight="bold" fontSize="lg">
        インポート方法
      </Text>
    </HStack>
    <List.Root gap={2} fontSize="sm" variant="plain">
      {[
        {
          step: 1,
          text: (
            <Text>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                textDecoration="underline"
                href={iidxUrl}
              >
                IIDX公式サイト
              </Link>{" "}
              にアクセスしてCSVをダウンロードします。
            </Text>
          ),
        },
        { step: 2, text: "入力エリアにCSVデータを直接貼り付けてください。" },
        { step: 3, text: "「インポートを開始」ボタンを押して完了を待ちます。" },
      ].map((item) => (
        <List.Item key={item.step}>
          <HStack align="start">
            <Box
              bg="blue.500"
              color="white"
              borderRadius="full"
              px={2}
              fontSize="xs"
            >
              {item.step}
            </Box>
            {typeof item.text === "string" ? (
              <Text>{item.text}</Text>
            ) : (
              item.text
            )}
          </HStack>
        </List.Item>
      ))}
    </List.Root>
  </Box>
);
