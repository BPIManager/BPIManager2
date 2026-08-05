import MyScoresPageShell from "@/components/partials/shell/MyScoresPageShell";
import SongsTable from "@/components/partials/common/Table";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function MyScoresByVersion() {
  const { t } = useTranslation();

  return (
    <MyScoresPageShell
      titlePrefix={t("page.myScores.title")}
      renderTable={({ userId, version }) => (
        <SongsTable userId={userId} version={version} />
      )}
    />
  );
}
