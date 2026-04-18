import { Meta } from "@/components/partials/Head";
import { ImportSuccessModal } from "@/components/partials/Import/SuccessModal/ui";
import { ImportView } from "@/components/partials/Import/View/ui";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { dummyCsv } from "@/constants/dummyCsv";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { useBatchImport } from "@/hooks/import/useBatchImport";
import { useState, useCallback } from "react";
import { PageLoader } from "@/components/ui/loading-spinner";
import { detectCsvType, type CsvType } from "@/utils/csv/detect";

export default function ImportPage() {
  const { user, isLoading, fbUser, refresh } = useUser();
  const [csvData, setCsvData] = useState(dummyCsv);
  const [detectedType, setDetectedType] = useState<CsvType>("unknown");
  const [selectedVersion, setSelectedVersion] = useState<string[]>([
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

  const onStartImport = async () => {
    const success = await runImport(csvData, selectedVersion[0]);
    if (success) handleSetCsvData("");
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      {!user && <AccountSettings />}
      <Meta title="データインポート" description="..." noIndex />

      <ImportView
        isLoggedIn={!!user?.userId}
        csvData={csvData}
        setCsvData={handleSetCsvData}
        detectedType={detectedType}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
        isProcessing={isProcessing}
        processStatus={processStatus}
        onStartImport={onStartImport}
      />
      <ImportSuccessModal
        result={importResult}
        version={selectedVersion[0]}
        onClose={() => setImportResult(null)}
      />
    </>
  );
}
