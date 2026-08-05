import { Wrench, BookOpen, ExternalLink } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const ApiSection = () => {
  const { t } = useTranslation();
  const API_DOCS_URL = "https://bpim2.apidog.io/";

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-bpim-primary/10 p-3 text-bpim-primary shadow-inner">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-bpim-primary/80">
            {t("login.api.tag")}
          </span>
          <h3 className="text-xl font-bold leading-tight text-bpim-text md:text-2xl">
            {t("login.api.title")}
          </h3>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-bpim-muted">
        {t("login.api.desc")}
      </p>

      <div className="overflow-hidden rounded-lg border border-bpim-border bg-bpim-surface p-4 font-mono text-[11px] leading-relaxed shadow-inner">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <span className="shrink-0 select-none text-bpim-primary">$</span>
            <span className="text-bpim-text">
              curl <span className="text-bpim-success">GET</span>{" "}
              {`"https://bpi2.poyashi.me/api/v1/users/abc123uid/scores?version=32"`}
            </span>
          </div>

          <pre className="mt-2 text-bpim-muted">
            {`[`}
            <br />
            {`  {`}
            <br />
            {`    `}
            <span className="text-bpim-info">{`"songId"`}</span>:{" "}
            <span className="text-bpim-danger">1024</span>,
            <br />
            {`    `}
            <span className="text-bpim-info">{`"title"`}</span>:{" "}
            <span className="text-bpim-warning">{`"V"`}</span>,
            <br />
            {`    `}
            <span className="text-bpim-info">{`"difficulty"`}</span>:{" "}
            <span className="text-bpim-warning">{`"ANOTHER"`}</span>,
            <br />
            {`    `}
            <span className="text-bpim-info">{`"exScore"`}</span>:{" "}
            <span className="text-bpim-danger">2805</span>,
            <br />
            {`    `}
            <span className="text-bpim-info">{`"bpi"`}</span>:{" "}
            <span className="text-bpim-danger">52.45</span>,
            <br />
            {`    ...`}
            <br />
            {`  }, ...`}
            <br />
            {`]`}
          </pre>
        </div>

        <p className="px-1 text-[10px] text-bpim-muted/60">
          {t("login.api.note")}
        </p>
      </div>

      <div className="pt-2">
        <a
          href={API_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-6 py-3 text-sm font-bold text-bpim-primary transition-all hover:bg-bpim-primary hover:text-bpim-bg active:scale-[0.98] sm:w-auto"
        >
          <BookOpen className="h-4 w-4" />
          {t("login.api.btn")}
          <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-60" />
        </a>
      </div>
    </div>
  );
};

export default ApiSection;
