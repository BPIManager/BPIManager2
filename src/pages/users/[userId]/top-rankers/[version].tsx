import { useRouter } from "next/router";
import UserProfileLayout from "@/components/partials/common/Profile/Layout/layout";
import ProfileMeta from "@/components/partials/common/Profile/Meta/ui";
import TopRankersContent from "@/components/partials/features/TopRankers";
import { TOP_RANKER_VERSIONS } from "@/constants/iidx/topRankerAreas";
import { useTranslation } from "@/hooks/common/useTranslation";

const DEFAULT_VERSION = TOP_RANKER_VERSIONS[TOP_RANKER_VERSIONS.length - 1];

export default function UserTopRankersPage() {
  const router = useRouter();
  const { t } = useTranslation();

  if (!router.isReady) return null;

  const userId = router.query.userId as string;
  const requested = router.query.version as string;
  const version = (TOP_RANKER_VERSIONS as readonly string[]).includes(requested)
    ? requested
    : DEFAULT_VERSION;

  return (
    <UserProfileLayout userId={userId} currentTab="topRankers">
      <ProfileMeta title={t("page.topRankers.title")} />
      <TopRankersContent userId={userId} version={version} />
    </UserProfileLayout>
  );
}
