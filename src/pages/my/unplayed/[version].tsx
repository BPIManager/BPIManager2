import { MyScoresPageShell } from "@/components/partials/MyScoresPageShell";
import { UnplayedSongsTable } from "@/components/partials/TableUnplayed";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function UnplayedScoresByVersion() {
  const { t } = useTranslation();

  return (
    <MyScoresPageShell
      titlePrefix={t("page.unplayed.title")}
      renderTable={({ userId, version }) => (
        <UnplayedSongsTable userId={userId} version={version} />
      )}
    />
  );
}
