import { Info } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import { SupporterListView } from "@/components/partials/common/UserList/Supporters/ui";
import { UserRecommendationCardSkeleton } from "@/components/partials/common/UserList/Card/skeleton";
import { FetchErrorState } from "@/components/partials/common/ErrorStates/FetchErrorState";
import { useSupporters } from "@/hooks/users/useSupporters";

type UseSupportersResult = ReturnType<typeof useSupporters>;

export const SupportersListSection = ({
  data,
  isLoading,
  isError,
}: UseSupportersResult) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-8">
      <div className="space-y-1 border-l-4 border-bpim-primary pl-4">
        <p className="text-md text-bpim-muted font-medium">
          {t("support.supportersTitle")}
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-bpim-info/20 bg-bpim-info/5 p-4 text-sm leading-relaxed text-bpim-muted shadow-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-bpim-info" />
        <p>
          {t("support.supportersInfoPart1")}
          <br className="hidden md:block" />
          {t("support.supportersInfoPart2")}
        </p>
      </div>

      <div className="py-1">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <UserRecommendationCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <FetchErrorState error={isError} />
        ) : (
          <SupporterListView users={data?.supporters ?? []} />
        )}
      </div>
    </section>
  );
};
