import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoreImportView, type ScoreImportProps } from "../ScoreView";
import { TowerImportView, type TowerImportProps } from "../TowerView";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  isLoggedIn: boolean;
  defaultTab?: "score" | "tower";
  score: ScoreImportProps;
  tower: TowerImportProps;
}

export const ImportView = (props: Props) => {
  const { t } = useTranslation();
  const { defaultTab = "score" } = props;

  return (
    <DashboardLayout>
      {!props.isLoggedIn ? (
        <LoginRequiredCard />
      ) : (
        <>
          <PageHeader
            title={t("import.view.title")}
            description={t("import.view.desc")}
          />
          <PageContainer>
            <Tabs defaultValue={defaultTab}>
              <TabsList className="mb-4 w-full sm:w-auto">
                <TabsTrigger value="score">{t("import.tab.score")}</TabsTrigger>
                <TabsTrigger value="tower">{t("import.tab.tower")}</TabsTrigger>
              </TabsList>

              <TabsContent value="score">
                <ScoreImportView {...props.score} />
              </TabsContent>

              <TabsContent value="tower">
                <TowerImportView {...props.tower} />
              </TabsContent>
            </Tabs>
          </PageContainer>
        </>
      )}
    </DashboardLayout>
  );
};
