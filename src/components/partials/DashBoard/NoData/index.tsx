import { DashCard } from "@/components/ui/chakra/dashcard";
import NextLink from "next/link";

export const NoDataAlert = () => {
  return (
    <DashCard className="my-4 focus:outline-none">
      <b className="text-white">
        おっと！まだデータが登録されていないようです...
      </b>
      <p className="mt-2 text-sm text-gray-400">
        これがあなたのプロフィールである場合は、「
        <NextLink
          href="/import"
          className="text-blue-400 underline decoration-blue-400/30 underline-offset-4 transition-colors hover:text-blue-300 hover:decoration-blue-300"
        >
          インポート
        </NextLink>
        」から今すぐデータを登録するか、今までBPIManagerを使っていた場合は「
        <NextLink
          href="/settings"
          className="text-blue-400 underline decoration-blue-400/30 underline-offset-4 transition-colors hover:text-blue-300 hover:decoration-blue-300"
        >
          データを移行
        </NextLink>
        」することができます!
      </p>
    </DashCard>
  );
};
