import { GetServerSideProps } from "next";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import GlobalRankingContainer from "@/components/partials/features/Ranking";
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
