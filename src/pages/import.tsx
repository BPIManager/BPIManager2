import { Meta } from "@/components/partials/Head";
import { ImportSuccessModal } from "@/components/partials/Import/SuccessModal/ui";
import { ImportView } from "@/components/partials/Import/View/ui";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { dummyCsv } from "@/constants/dummyCsv";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { useBatchImport } from "@/hooks/import/useBatchImport";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ImportPage() {
  const { user, isLoading, fbUser, refresh } = useUser();
  const [csvData, setCsvData] = useState(dummyCsv);
  const [selectedVersion, setSelectedVersion] = useState<string[]>([
    latestVersion,
  ]);

  const {
    runImport,
    isProcessing,
    processStatus,
    importResult,
    setImportResult,
  } = useBatchImport(fbUser, refresh);

  const onStartImport = async () => {
    const success = await runImport(csvData, selectedVersion[0]);
    if (success) setCsvData("");
  };

  if (isLoading)
    return (
      <div className="flex h-[90vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );

  return (
    <>
      {!user && <AccountSettings />}
      <Meta title="データインポート" description="..." noIndex />

      <ImportView
        isLoggedIn={!!user?.userId}
        csvData={csvData}
        setCsvData={setCsvData}
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
