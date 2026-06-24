import { GetServerSideProps } from "next";
import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { GlobalRankingContainer } from "@/components/partials/Ranking";
import { useTranslation } from "@/hooks/common/useTranslation";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function RivalsPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <Meta
        title={t("page.ranking.title")}
        description={t("page.ranking.metaDesc")}
      />

      <GlobalRankingContainer />
    </DashboardLayout>
  );
}
