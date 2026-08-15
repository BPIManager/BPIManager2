import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ListMultiSelect from "./ListMultiSelect";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { FollowListSummary, FollowingWithLists } from "@/types/users/followList";

interface Props {
  user: FollowingWithLists;
  lists: FollowListSummary[];
  pending: boolean;
  onToggleList: (listId: number) => void;
}

const RivalListEditRow = ({ user, lists, pending, onToggleList }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-bpim-border bg-bpim-surface-2/60 px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-8 w-8 border border-bpim-border">
          <AvatarImage src={user.profileImage ?? ""} />
          <AvatarFallback>{user.userName?.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-bold text-bpim-text">
          {user.userName ?? t("rivals.list.unclassified")}
        </span>
      </div>
      <ListMultiSelect
        lists={lists}
        selectedListIds={user.listIds}
        onToggle={onToggleList}
        disabled={pending}
      />
    </div>
  );
};

export default RivalListEditRow;
