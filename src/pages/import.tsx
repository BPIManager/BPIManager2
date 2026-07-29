import { Meta } from "@/components/partials/common/Head";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ImportSuccessModal } from "@/components/partials/Import/SuccessModal/ui";
import { ImportView } from "@/components/partials/Import/View";
import AccountSettings from "@/components/partials/common/Modal/AccountSettings";
import { dummyCsv } from "@/constants/ui/dummyCsv";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { useUser } from "@/contexts/users/UserContext";
import { useBatchImport } from "@/hooks/import/useBatchImport";
import { useIidxTowerImport } from "@/hooks/import/useIidxTowerImport";
import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { PageLoader } from "@/components/ui/loading-spinner";
import { detectCsvType, type CsvType } from "@/utils/csv/detect";
import { TowerImportSuccessModal } from "@/components/partials/Import/TowerSuccessModal/ui";

export default function ImportPage() {
  const router = useRouter();
  const defaultTab = router.query.tab === "tower" ? "tower" : "score";
  const { user, isLoading, fbUser, refresh } = useUser();
  const { t } = useTranslation();
  const [csvData, setCsvData] = useState(dummyCsv);
  const [detectedType, setDetectedType] = useState<CsvType>("unknown");
  const [selectedVersion, setSelectedVersion] = useState<string[]>([
    latestVersion,
  ]);
  const [towerCsvData, setTowerCsvData] = useState("");
  const [towerSelectedVersion, setTowerSelectedVersion] = useState<string[]>([
    latestVersion,
  ]);

  const handleSetCsvData = useCallback((v: string) => {
    setCsvData(v);
    setDetectedType(v.trim() ? detectCsvType(v) : "unknown");
  }, []);

  const {
    runImport,
    isProcessing,
    processStatus,
    importResult,
    setImportResult,
  } = useBatchImport(fbUser, refresh);

  const {
    runImport: runTowerImport,
    isProcessing: isTowerProcessing,
    processStatus: towerProcessStatus,
    importResult: towerImportResult,
    setImportResult: setTowerImportResult,
  } = useIidxTowerImport(fbUser);

  const onStartImport = async () => {
    const success = await runImport(csvData, selectedVersion[0]);
    if (success) handleSetCsvData("");
  };

  const onStartTowerImport = async () => {
    const success = await runTowerImport(towerCsvData, towerSelectedVersion[0]);
    if (success) setTowerCsvData("");
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      {!user && <AccountSettings />}
      <Meta title={t("page.import.title")} noIndex />

      <ImportView
        defaultTab={defaultTab}
        isLoggedIn={!!user?.userId}
        score={{
          csvData,
          setCsvData: handleSetCsvData,
          detectedType,
          selectedVersion,
          setSelectedVersion,
          isProcessing,
          processStatus,
          onStartImport,
        }}
        tower={{
          csvData: towerCsvData,
          setCsvData: setTowerCsvData,
          selectedVersion: towerSelectedVersion,
          setSelectedVersion: setTowerSelectedVersion,
          isProcessing: isTowerProcessing,
          processStatus: towerProcessStatus,
          onStartImport: onStartTowerImport,
        }}
      />

      <ImportSuccessModal
        result={importResult}
        version={selectedVersion[0]}
        onClose={() => setImportResult(null)}
      />

      <TowerImportSuccessModal
        result={towerImportResult}
        onClose={() => setTowerImportResult(null)}
      />
    </>
  );
}
