import { DashCard } from "@/components/ui/dashcard";
import NextLink from "next/link";

export const NoDataAlert = () => {
  return (
    <DashCard className="my-4 focus:outline-none">
      <b className="text-white">
        おっと！まだデータが登録されていないようです...
      </b>
      <p className="mt-2 text-sm text-bpim-muted">
        これがあなたのプロフィールである場合は、「
        <NextLink
          href="/import"
          className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-blue-300"
        >
          インポート
        </NextLink>
        」から今すぐデータを登録するか、今までBPIManagerを使っていた場合は「
        <NextLink
          href="/settings"
          className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-blue-300"
        >
          データを移行
        </NextLink>
        」することができます!
      </p>
    </DashCard>
  );
};
