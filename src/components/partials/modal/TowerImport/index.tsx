import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import TowerImportView from "@/components/partials/common/Import/TowerView";
import { useUser } from "@/contexts/users/UserContext";
import { useIidxTowerImport } from "@/hooks/import/useIidxTowerImport";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** 取り込み先の初期バージョン */
  version: string;
  /** 取り込み成功後(モーダルを閉じる前)に呼ばれる */
  onImported: () => void;
}

const TowerImportModal = ({ isOpen, onClose, version, onImported }: Props) => {
  const { t } = useTranslation();
  const { fbUser } = useUser();
  const [csvData, setCsvData] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string[]>([version]);
  const { runImport, isProcessing, processStatus } = useIidxTowerImport(fbUser);

  const onStartImport = async () => {
    const success = await runImport(csvData, selectedVersion[0]);
    if (!success) return;
    setCsvData("");
    onImported();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-x-hidden overflow-y-auto rounded-2xl border-bpim-border bg-bpim-bg text-bpim-text shadow-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t("import.tab.tower")}
          </DialogTitle>
          <DialogDescription className="text-xs text-bpim-muted">
            {t("logs.perf.tower.modalDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0">
          <TowerImportView
            csvData={csvData}
            setCsvData={setCsvData}
            selectedVersion={selectedVersion}
            setSelectedVersion={setSelectedVersion}
            isProcessing={isProcessing}
            processStatus={processStatus}
            onStartImport={onStartImport}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TowerImportModal;
