import { DashCard } from "@/components/ui/dashcard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  isViewingSelf: boolean;
  viewedUserName: string | null;
}

/**
 * ユーザーIDで他ユーザーのデータを検索・表示する検索バー。アクセス可否は API（withUserApiHandler の checkUserAccess）に委ねる。
 */
export default function UserSearchBar({
  searchInput,
  onSearchInputChange,
  onSearch,
  onReset,
  isViewingSelf,
  viewedUserName,
}: Props) {
  const { t } = useTranslation();

  return (
    <DashCard>
      <label className="mb-1 block text-xs text-muted-foreground">
        {t("newBpi.userSearch.label")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder={t("newBpi.userSearch.placeholder")}
          className="sm:max-w-md"
        />
        <div className="flex gap-2">
          <Button onClick={onSearch} disabled={!searchInput.trim()}>
            {t("newBpi.userSearch.button")}
          </Button>
          {!isViewingSelf && (
            <Button variant="outline" onClick={onReset}>
              {t("newBpi.userSearch.reset")}
            </Button>
          )}
        </div>
      </div>

      {!isViewingSelf && viewedUserName && (
        <div className="mt-3">
          <Badge variant="secondary">
            {t("newBpi.userSearch.viewing")}: {viewedUserName}
          </Badge>
        </div>
      )}
    </DashCard>
  );
}
