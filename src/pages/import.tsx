import { Meta } from "@/components/partials/Head";
import { ImportSuccessModal } from "@/components/partials/Import/SuccessModal/ui";
import { ImportView } from "@/components/partials/Import/View/ui";
import LoginPage from "@/components/partials/LogIn/page";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { dummyCsv } from "@/constants/dummyCsv";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { useBatchImport } from "@/hooks/import/useBatchImport";
import { Center, Spinner } from "@chakra-ui/react";
import { useState } from "react";

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
      <Center h="90vh">
        <Spinner />
      </Center>
    );
  if (!fbUser) return <LoginPage />;

  return (
    <>
      {!user && <AccountSettings />}
      <Meta title="データインポート" description="..." />

      <ImportView
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
