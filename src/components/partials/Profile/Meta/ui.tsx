import { useStaticProfile } from "@/contexts/profile/ProfileContext";
import { Meta } from "../../Head";

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

  const ogImage = profile.profileImage || "/ogp-default.png";

  const defaultDescription =
    profile.profileText ||
    `${profile.userName}さんのBPIM2プロフィールページです。`;

  const formatIIDXId = (str: string) => {
    return str.replace(/^(\d{4})(\d{4})$/, "$1-$2");
  };

  return (
    <Meta
      title={`${profile.userName || "undefined"} (${formatIIDXId(profile.iidxId || "")}) さんの${title}`}
      description={
        (description || "")
          ?.replace("$userName$", profile.userName)
          .replace("$profileText$", profile.profileText || "")
          .replace("$iidxid$", formatIIDXId(profile.iidxId || "")) ||
        defaultDescription
      }
      noIndex={noIndex}
      ogImage={ogImage}
      ogType="article"
    />
  );
};
