import { useStaticProfile } from "@/contexts/profile/ProfileContext";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { useTranslation } from "@/hooks/common/useTranslation";

interface ProfileMetaProps {
  title: string;
  description?: string;
  noIndex?: boolean;
}

const ProfileMeta = ({
  title,
  description,
  noIndex,
}: ProfileMetaProps) => {
  const { profile } = useStaticProfile();
  const { t } = useTranslation();

  // 画像が無いときは Meta の既定OGP画像を使う
  const ogImage = profile.profileImage || undefined;

  const iidxId = formatIIDXId(profile.iidxId || "");
  const profileHeading = [profile.userName, iidxId ? `(${iidxId})` : ""]
    .filter(Boolean)
    .join(" ");

  const defaultDescription =
    profile.profileText ||
    (profile.userName
      ? `${profile.userName}${t("profile.meta.defaultDescSuffix")}`
      : undefined);

  return (
    <Meta
      // ユーザー名・IIDX IDが無いとき、先頭に連結語だけが残ったり "undefined" が入ったりしないようにする
      title={
        profileHeading
          ? `${profileHeading}${t("profile.meta.titleConnector")}${title}`
          : title
      }
      description={
        (description || "")
          ?.replace("$userName$", profile.userName ?? "")
          .replace("$profileText$", profile.profileText || "")
          .replace("$iidxid$", formatIIDXId(profile.iidxId || "")) ||
        defaultDescription
      }
      ogImage={ogImage}
      ogType="article"
      noIndex={noIndex}
    />
  );
};

export default ProfileMeta;
