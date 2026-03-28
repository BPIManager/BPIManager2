export interface LogsDetailViewProps {
  userId: string | undefined;
  version: string | undefined;
  batchId?: string;
  date?: string;
  type: "batch" | "daily" | "weekly" | "monthly";
  isPublicPage?: boolean;
}
