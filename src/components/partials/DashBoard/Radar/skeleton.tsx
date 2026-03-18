import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const RadarSkeleton = () => {
  return (
    <DashCard>
      <Skeleton className="mb-4 h-[14px] w-[100px]" />

      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div className="flex h-[300px] items-center justify-center">
          <div className="relative h-[200px] w-[200px]">
            <div className="absolute inset-0 rounded-full border border-bpim-border" />
            <div className="absolute inset-[30px] rounded-full border border-bpim-border" />
            <div className="absolute inset-[60px] rounded-full border border-bpim-border" />
            <div
              className="h-full w-full bg-blue-500/10"
              style={{
                clipPath:
                  "polygon(50% 10%, 90% 40%, 80% 80%, 30% 90%, 10% 50%)",
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[36px] w-full rounded-md" />
          ))}
        </div>
      </div>
    </DashCard>
  );
};
