import { MyScoresPageShell } from "@/components/partials/shell/MyScoresPageShell";
import { AllSongsTable } from "@/components/partials/features/AllSongs";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function MyScoresByVersion() {
  const { t } = useTranslation();

  return (
    <MyScoresPageShell
      titlePrefix={t("page.myScores.title")}
      renderTable={({ userId }) => <AllSongsTable userId={userId} />}
    />
  );
}
