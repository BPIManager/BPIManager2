import { useState } from "react";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import TowerImportModal from "@/components/partials/modal/TowerImport";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePerformance } from "@/hooks/batches/usePerformance";
import PerformanceView from "./ui";

interface Props {
  userId?: string;
  version?: string;
  /** 対象日 (YYYY-MM-DD, JST) */
  date?: string;
  /** 自分のログのときのみ true。タワーのインポート導線を出す */
  canImport: boolean;
  /** タブが表示されている間だけフェッチする */
  active: boolean;
  onOpenSongs: () => void;
}

const PerformanceTab = ({
  userId,
  version,
  date,
  canImport,
  active,
  onOpenSongs,
}: Props) => {
  const { data, isLoading, isError, mutate } = usePerformance(
    userId,
    version,
    date,
    active,
  );
  const [isImportOpen, setIsImportOpen] = useState(false);

  if (isLoading || (!data && !isError)) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  if (isError || !data) {
    return <FetchErrorState error={isError} onRetry={() => mutate()} />;
  }

  return (
    <>
      <PerformanceView
        data={data}
        onOpenSongs={onOpenSongs}
        onOpenTowerImport={canImport ? () => setIsImportOpen(true) : undefined}
      />
      {canImport && (
        <TowerImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          version={version ?? ""}
          onImported={() => mutate()}
        />
      )}
    </>
  );
};

export default PerformanceTab;
