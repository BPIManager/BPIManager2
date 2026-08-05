"use client";

import { useSupporters } from "@/hooks/users/useSupporters";
import { useTranslation } from "@/hooks/common/useTranslation";
import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import WhySection from "./WhySection/ui";
import DonationSection from "./DonationSection/ui";
import SupportersListSection from "./SupportersListSection/ui";
import OssSection from "./OssSection/ui";

const SupportersPage = () => {
  const supporters = useSupporters();
  const { t } = useTranslation();

  return (
    <div className="pb-20">
      <PageHeader
        title={t("page.support.title")}
        description={t("page.support.desc")}
      />

      <PageContainer>
        <div className="flex flex-col gap-16">
          <WhySection />
          <DonationSection />
          <SupportersListSection {...supporters} />
          <OssSection {...supporters} />
        </div>
      </PageContainer>
    </div>
  );
};

export default SupportersPage;
