import { Meta } from "@/components/partials/Head";
import { ImportSuccessModal } from "@/components/partials/Import/SuccessModal/ui";
import { ImportView } from "@/components/partials/Import/View/ui";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { dummyCsv } from "@/constants/dummyCsv";
import { latestVersion } from "@/constants/latestVersion";
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
      <Meta title="データインポート" description="..." noIndex />

      <ImportView
        defaultTab={defaultTab}
        isLoggedIn={!!user?.userId}
        csvData={csvData}
        setCsvData={handleSetCsvData}
        detectedType={detectedType}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
        isProcessing={isProcessing}
        processStatus={processStatus}
        onStartImport={onStartImport}
        towerCsvData={towerCsvData}
        setTowerCsvData={setTowerCsvData}
        towerSelectedVersion={towerSelectedVersion}
        setTowerSelectedVersion={setTowerSelectedVersion}
        isTowerProcessing={isTowerProcessing}
        towerProcessStatus={towerProcessStatus}
        onStartTowerImport={onStartTowerImport}
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
