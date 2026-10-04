import { Meta } from "@/components/partials/common/PageChrome/Head";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import LoginPageBody from "@/components/partials/common/Auth/LoginPageBody";
import { useTranslation } from "@/hooks/common/useTranslation";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { SITE_URL } from "@/constants/site/url";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <Meta
        title=""
        description={t("login.subTitle")}
        ogImage={`${SITE_URL}${API_V2_PREFIX}/site/ogp-sample`}
      />
      <LoginPageBody />
    </DashboardLayout>
  );
}
