import { Meta } from "@/components/partials/common/PageChrome/Head";
import { useTranslation } from "@/hooks/common/useTranslation";
import ImportSuccessModal from "@/components/partials/features/Import/SuccessModal/ui";
import ImportView from "@/components/partials/features/Import/View";
import { dummyCsv } from "@/constants/ui/dummyCsv";
import {
  latestVersion,
  latestVersionReleaseDate,
} from "@/constants/iidx/iidxVersions";
import { useUser } from "@/contexts/users/UserContext";
import { useBatchImport } from "@/hooks/import/useBatchImport";
import { useIidxTowerImport } from "@/hooks/import/useIidxTowerImport";
import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { PageLoader } from "@/components/ui/loading-spinner";
import { detectCsvType, type CsvType } from "@/utils/csv/detect";
import TowerImportSuccessModal from "@/components/partials/features/Import/TowerSuccessModal/ui";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";

/** 誤って旧バージョンCSVを取り込んでしまった場合の削除方法を案内するツイート */
const LEGACY_IMPORT_DELETE_GUIDE_URL =
  "https://x.com/BPIManager/status/2046212431773602001";

export default function ImportPage() {
  const router = useRouter();
  const defaultTab = router.query.tab === "tower" ? "tower" : "score";
  const { user, isLoading, fbUser, refresh } = useUser();
  const { t, tFormat } = useTranslation();
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
    pendingLegacyConfirm,
    confirmLegacyImport,
    cancelLegacyImport,
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

  const onConfirmLegacyImport = async () => {
    const success = await confirmLegacyImport();
    if (success) handleSetCsvData("");
  };

  const onStartTowerImport = async () => {
    const success = await runTowerImport(towerCsvData, towerSelectedVersion[0]);
    if (success) setTowerCsvData("");
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
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

      <ActionConfirmDialog
        isOpen={!!pendingLegacyConfirm}
        onClose={cancelLegacyImport}
        onConfirm={onConfirmLegacyImport}
        isLoading={isProcessing}
        title={t("import.legacyConfirm.title")}
        confirmLabel={t("import.legacyConfirm.confirm")}
        cancelLabel={t("import.legacyConfirm.cancel")}
        description={
          <div className="space-y-2">
            <p>
              {tFormat("import.legacyConfirm.description", {
                date: latestVersionReleaseDate,
              })}
            </p>
            <p className="text-bpim-muted">
              {t("import.legacyConfirm.deleteHintPrefix")}
              <a
                href={LEGACY_IMPORT_DELETE_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bpim-primary hover:underline"
              >
                {t("import.legacyConfirm.deleteHintLinkText")}
              </a>
              {t("import.legacyConfirm.deleteHintSuffix")}
            </p>
          </div>
        }
      />
    </>
  );
}
