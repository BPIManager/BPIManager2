import {
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const InstructionSection = () => {
  const { t } = useTranslation();

  const infinitasSteps = [
    {
      step: 1,
      text: (
        <>
          「
          <a
            href="https://github.com/kaktuswald/inf-notebook/wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-bpim-primary"
          >
            リザルト手帳
          </a>
          」「
          <a
            href="https://github.com/olji/Reflux"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-bpim-primary"
          >
            Reflux
          </a>
          」「
          <a
            href="https://github.com/dj-kata/inf_daken_counter_obsw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-bpim-primary"
          >
            打鍵カウンタ
          </a>
          」{t("import.instruction.infinitas.step1.suffix")}
        </>
      ),
    },
    { step: 2, text: t("import.instruction.infinitas.step2") },
    { step: 3, text: t("import.instruction.infinitas.step3") },
    { step: 4, text: t("import.instruction.infinitas.step4") },
  ];

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-bpim-border bg-bpim-surface p-4 md:p-6">
      <div className="flex items-center gap-3 border-b border-bpim-border pb-4">
        <HelpCircle className="h-6 w-6 text-bpim-primary" />
        <h3 className="text-xl font-bold text-bpim-text">
          {t("import.instruction.title")}
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {infinitasSteps.map((item) => (
            <StepItem key={item.step} step={item.step} text={item.text} />
          ))}
        </ul>

        <div className="rounded-lg border border-bpim-info/20 bg-bpim-info/5 p-4 text-[13px] leading-relaxed">
          <div className="flex items-start gap-2 text-bpim-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs text-bpim-muted">
              {t("import.instruction.infinitas.note")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({ step, text }: { step: number; text: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed text-bpim-text">
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-[10px] font-black text-bpim-bg shadow-sm shadow-bpim-primary/20">
      {step}
    </span>
    <div className="pt-0.5">{text}</div>
  </li>
);

export default InstructionSection;
