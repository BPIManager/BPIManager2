import { MyScoresPageShell } from "@/components/partials/common/MyScoresPageShell";
import { UnplayedSongsTable } from "@/components/partials/features/TableUnplayed";
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
