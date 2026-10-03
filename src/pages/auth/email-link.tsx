import EmailLinkComplete from "@/components/partials/features/Auth/EmailLinkComplete";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function EmailLinkPage() {
  const { t } = useTranslation();
  return (
    <>
      <Meta noIndex title={t("login.title")} />
      <EmailLinkComplete />
    </>
  );
}
