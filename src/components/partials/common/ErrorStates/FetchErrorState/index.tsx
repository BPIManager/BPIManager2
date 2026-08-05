import { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Lock, RefreshCcw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

export type FetchError =
  | { status?: number; info?: { message?: string }; message?: string }
  | null
  | undefined;

interface FetchErrorStateProps {
  error?: FetchError;
  title?: string;
  description?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  homeHref?: string;
  className?: string;
}

/**
 * データ取得失敗時の表示を共通化したプレゼンテーションコンポーネント。
 * error.status(403/404)に応じてデフォルトの文言・アイコンを切り替え、
 * title/description/iconで各画面固有の文言に上書きできる。
 */
const FetchErrorState = ({
  error,
  title,
  description,
  icon,
  onRetry,
  homeHref,
  className,
}: FetchErrorStateProps) => {
  const { t } = useTranslation();
  const status = error?.status;

  const variant =
    status === 403 ? "forbidden" : status === 404 ? "notFound" : "generic";

  const defaults = {
    forbidden: {
      title: t("common.error.forbidden.title"),
      description: t("common.error.forbidden.description"),
      icon: <Lock size={48} />,
      color: "text-bpim-warning",
    },
    notFound: {
      title: t("common.error.notFound.title"),
      description: t("common.error.notFound.description"),
      icon: <SearchX size={48} />,
      color: "text-bpim-muted",
    },
    generic: {
      title: t("common.error.fetchFailed"),
      description:
        error?.info?.message ||
        error?.message ||
        t("common.error.defaultMessage"),
      icon: <AlertCircle size={48} />,
      color: "text-bpim-danger",
    },
  }[variant];

  const errorDetail = error
    ? typeof error === "object"
      ? JSON.stringify(error, null, 2)
      : String(error)
    : null;

  return (
    <div
      className={cn(
        "flex min-h-100 w-full flex-col items-center justify-center gap-6 text-center",
        className,
      )}
    >
      <div
        className={cn("rounded-full bg-bpim-surface-2/60 p-6", defaults.color)}
      >
        {icon ?? defaults.icon}
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-bpim-text">
          {title ?? defaults.title}
        </h2>
        <p className="max-w-100 text-sm leading-relaxed text-bpim-muted">
          {description ?? defaults.description}
        </p>

        {status && (
          <code className="mt-2 rounded bg-bpim-danger/10 px-2 py-0.5 font-mono text-[10px] font-bold text-bpim-danger">
            HTTP {status}
          </code>
        )}

        {errorDetail && (
          <div className="mt-4 w-full text-left">
            <label className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-wider text-bpim-subtle">
              Error Details:
            </label>
            <pre className="max-h-50 w-full overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-bpim-border bg-bpim-bg/40 p-4 font-mono text-[10px] text-bpim-muted scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {errorDetail}
            </pre>
          </div>
        )}
      </div>

      {(onRetry || homeHref) && (
        <div className="flex items-center gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="group flex items-center gap-2 rounded-full border-bpim-border px-6 transition-colors hover:bg-bpim-overlay/50 hover:text-bpim-primary"
            >
              <RefreshCcw
                size={14}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
              {t("common.error.retry")}
            </Button>
          )}
          {homeHref && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-bpim-border px-6 hover:bg-bpim-overlay/50"
            >
              <Link href={homeHref}>{t("common.error.backHome")}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FetchErrorState;
