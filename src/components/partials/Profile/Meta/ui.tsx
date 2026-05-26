import { useStaticProfile } from "@/contexts/profile/ProfileContext";
import { Meta } from "../../Head";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { useTranslation } from "@/hooks/common/useTranslation";

interface ProfileMetaProps {
  title: string;
  description?: string;
  noIndex?: boolean;
}

export const ProfileMeta = ({
  title,
  description,
  noIndex,
}: ProfileMetaProps) => {
  const { profile } = useStaticProfile();
  const { t } = useTranslation();

  const ogImage = profile.profileImage || "/ogp-default.png";

  const defaultDescription =
    profile.profileText ||
    `${profile.userName}${t("profile.meta.defaultDescSuffix")}`;

  return (
    <Meta
      title={`${profile.userName || "undefined"} (${formatIIDXId(profile.iidxId || "")})${t("profile.meta.titleConnector")}${title}`}
      description={
        (description || "")
          ?.replace("$userName$", profile.userName)
          .replace("$profileText$", profile.profileText || "")
          .replace("$iidxid$", formatIIDXId(profile.iidxId || "")) ||
        defaultDescription
      }
      ogImage={ogImage}
      ogType="article"
    />
  );
};
