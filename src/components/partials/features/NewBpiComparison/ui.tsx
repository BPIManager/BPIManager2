import { useState } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";
import UserSearchBar from "./UserSearchBar";
import PlayersTab from "./PlayersTab";
import { NoticeCard, SummaryCards } from "./sections";
import ListTab from "./Tabs/ListTab";
import ChartTab from "./Tabs/ChartTab";
import type { Props } from "./types";

export type { SortKey, AccessState, NewBpiRow } from "./types";

export default function NewBpiComparisonUi(props: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("list");

  return (
    <>
      <PageHeader title={t("page.newBpi.title")} description={t("page.newBpi.desc")} />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <UserSearchBar
            searchInput={props.searchInput}
            onSearchInputChange={props.onSearchInputChange}
            onSearch={props.onSearch}
            onReset={props.onReset}
            isViewingSelf={props.isViewingSelf}
            viewedUserName={props.viewedUserName}
          />

          {props.accessState === "not-found" && (
            <DashCard className="text-center text-sm text-muted-foreground">
              {t("newBpi.userSearch.notFound")}
            </DashCard>
          )}
          {props.accessState === "private" && (
            <DashCard className="text-center text-sm text-muted-foreground">
              {t("newBpi.userSearch.private")}
            </DashCard>
          )}
          {(props.accessState === "loading" ||
            (props.accessState === "ok" && props.isDataLoading)) && (
            <SectionLoader className="h-64 w-full" />
          )}

          {props.accessState === "ok" && !props.isDataLoading && (
            <>
              <NoticeCard />

              <SummaryCards
                currentTotalBpi={props.currentTotalBpi}
                newTotalBpi={props.newTotalBpi}
                comparableCount={props.comparableCount}
              />

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-fit">
                  <TabsTrigger value="list">{t("newBpi.tab.list")}</TabsTrigger>
                  <TabsTrigger value="chart">{t("newBpi.tab.chart")}</TabsTrigger>
                  <TabsTrigger value="players">{t("newBpi.tab.players")}</TabsTrigger>
                </TabsList>
                <TabsContent value="list">
                  <ListTab
                    rows={props.rows}
                    sortKey={props.sortKey}
                    onSortKeyChange={props.onSortKeyChange}
                    radarCurrent={props.radarCurrent}
                    radarNew={props.radarNew}
                    listExpandedSongId={props.listExpandedSongId}
                    onToggleListSong={props.onToggleListSong}
                    selectedSongParams={props.selectedSongParams}
                    curveData={props.curveData}
                    scoreRateRows={props.scoreRateRows}
                    scoreRateMaxScore={props.scoreRateMaxScore}
                    selectedSongUserPoint={props.selectedSongUserPoint}
                  />
                </TabsContent>
                <TabsContent value="players">
                  <PlayersTab
                    onSelectUser={(targetUserId) => {
                      props.onSelectUser(targetUserId);
                      setActiveTab("list");
                    }}
                  />
                </TabsContent>
                <TabsContent value="chart">
                  <ChartTab
                    curveEligibleRows={props.curveEligibleRows}
                    selectedSongId={props.selectedSongId}
                    onSelectedSongIdChange={props.onSelectedSongIdChange}
                    curveData={props.curveData}
                    scoreRateRows={props.scoreRateRows}
                    scoreRateMaxScore={props.scoreRateMaxScore}
                    selectedSongUserPoint={props.selectedSongUserPoint}
                    selectedSongFormula={props.selectedSongFormula}
                    selectedSongSimulator={props.selectedSongSimulator}
                    selectedSongInitialScore={props.selectedSongInitialScore}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
