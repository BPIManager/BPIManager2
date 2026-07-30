import { Meta } from "@/components/partials/common/PageChrome/Head";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { LoginPageBody } from "@/components/partials/common/Auth/LoginPageBody";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <Meta title="" description={t("login.subTitle")} />
      <LoginPageBody />
    </DashboardLayout>
  );
}
