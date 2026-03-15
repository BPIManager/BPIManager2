import { DashCard } from "@/components/ui/dashcard";
import { Link, Text } from "@chakra-ui/react";

export const NoDataAlert = () => {
  return (
    <DashCard my={4} _focus={{ outline: "none" }}>
      <b>おっと！まだデータが登録されていないようです...</b>
      <Text fontSize={"sm"} mt={2}>
        これがあなたのプロフィールである場合は、「
        <Link textDecoration={"underline"} href="/import">
          インポート
        </Link>
        」から今すぐデータを登録するか、今までBPIManagerを使っていた場合は「
        <Link textDecoration={"underline"} href="/settings">
          データを移行
        </Link>
        」することができます!
      </Text>
    </DashCard>
  );
};
