import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogErrorStateProps {
  error: { status?: number; info?: { message?: string }; message?: string } | null | undefined;
  onRetry: () => void;
}

export const LogErrorState = ({ error, onRetry }: LogErrorStateProps) => {
  const status = error?.status;
  const message =
    error?.info?.message || error?.message || "通信エラーが発生しました";

  const errorDetail =
    typeof error === "object" ? JSON.stringify(error, null, 2) : String(error);

  return (
    <div className="flex h-[500px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-bpim-danger/10 p-6 text-bpim-danger">
          <AlertCircle size={48} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold text-bpim-text">
            データの取得に失敗しました
          </h2>
          <p className="max-w-[400px] text-sm text-bpim-muted">{message}</p>

          {status && (
            <code className="mt-2 rounded bg-bpim-danger/10 px-2 py-0.5 font-mono text-[10px] font-bold text-bpim-danger">
              HTTP {status}
            </code>
          )}

          <div className="mt-4 w-full text-left">
            <label className="ml-1 mb-1 block text-[10px] font-bold text-bpim-subtle uppercase tracking-wider">
              Error Details:
            </label>
            <pre className="w-full max-h-[200px] overflow-y-auto rounded-md border border-bpim-border bg-bpim-bg/40 p-4 font-mono text-[10px] text-bpim-muted whitespace-pre-wrap break-all scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {errorDetail}
            </pre>
          </div>
        </div>

        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="group flex items-center gap-2 rounded-full border-bpim-border px-6 transition-colors hover:bg-bpim-overlay/50 hover:text-bpim-primary"
        >
          <RefreshCcw
            size={14}
            className="transition-transform group-hover:rotate-180 duration-500"
          />
          再試行する
        </Button>
      </div>
    </div>
  );
};
