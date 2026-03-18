import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  icon: Icon,
  rightElement,
}: PageHeaderProps) => (
  <header className="relative mb-6 overflow-hidden border-b border-white/10 bg-slate-950 px-4 pt-8 pb-6 md:pt-12 md:pb-8">
    <div
      className="pointer-events-none absolute -top-[20%] -left-[10%] h-[150%] w-[40%] bg-blue-900/15 blur-[120px]"
      aria-hidden="true"
    />

    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex items-center justify-center rounded-lg border border-blue-800 bg-blue-950 p-2">
                <Icon className="h-6 w-6 text-blue-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-white leading-[1.1] md:text-4xl">
              {title}
            </h1>
          </div>

          {description && (
            <p
              className={cn(
                "hidden text-base font-medium text-white/60 sm:block max-w-2xl",
                Icon ? "sm:pl-[52px]" : "pl-0",
              )}
            >
              {description}
            </p>
          )}
        </div>

        {rightElement && <div className="pb-1">{rightElement}</div>}
      </div>
    </div>
  </header>
);

export const PageContainer = ({ children }: { children: ReactNode }) => (
  <main className="mx-auto w-full max-w-[1920px] px-3 py-4 md:px-8 lg:px-16">
    {children}
  </main>
);
