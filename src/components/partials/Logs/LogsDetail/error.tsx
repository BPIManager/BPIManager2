import { AlertCircle } from "lucide-react";
import { LuRefreshCcw } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface LogErrorStateProps {
  error: any;
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
        <div className="rounded-full bg-red-500/10 p-6 text-red-500">
          <AlertCircle size={48} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold text-white">
            データの取得に失敗しました
          </h2>
          <p className="max-w-[400px] text-sm text-gray-500">{message}</p>

          {status && (
            <code className="mt-2 rounded bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400">
              HTTP {status}
            </code>
          )}

          <div className="mt-4 w-full text-left">
            <label className="ml-1 mb-1 block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              Error Details:
            </label>
            <pre className="w-full max-h-[200px] overflow-y-auto rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[10px] text-gray-400 whitespace-pre-wrap break-all scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {errorDetail}
            </pre>
          </div>
        </div>

        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="group flex items-center gap-2 rounded-full border-white/10 px-6 transition-colors hover:bg-white/5 hover:text-blue-400"
        >
          <LuRefreshCcw
            size={14}
            className="transition-transform group-hover:rotate-180 duration-500"
          />
          再試行する
        </Button>
      </div>
    </div>
  );
};
