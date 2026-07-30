import { LockIcon } from "lucide-react";
import { PageContainer } from "@/components/partials/common/PageChrome/Header";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/common/useTranslation";
import { LoginSection } from "./LoginSection/ui";
import { BpiExplainSection } from "./BpiExplainSection/ui";
import {
  ShowcaseSection,
  MockBpiHistoryChart,
  MockCurrentBpiCard,
  MockRadarChart,
  MockBpmBars,
  MockBpiDistribution,
  MockActivityCalendar,
  MockRivalBars,
} from "./ShowcaseSection/ui";
import { ApiSection } from "./ApiSection/ui";
import { PrivacySection } from "./PrivacySection/ui";

export const LoginPageBody = ({
  requiredMessage,
}: {
  requiredMessage?: string;
} = {}) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bpim-bg py-16 text-bpim-text">
      <PageContainer>
        {requiredMessage && (
          <div className="mb-10 flex items-start gap-3 rounded-xl border border-bpim-primary/30 bg-bpim-primary/8 px-4 py-3 text-bpim-primary">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{requiredMessage}</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="bg-linear-to-br from-bpim-text to-gray-600 bg-clip-text text-6xl font-bold tracking-tighter text-transparent leading-none md:text-8xl">
            {t("login.title")}
          </h1>
          <p className="max-w-2xl text-base text-bpim-muted md:text-lg">
            {t("login.subTitle")}
          </p>
        </div>

        <div className="my-10">
          <LoginSection />
        </div>

        <Separator className="mb-20 bg-bpim-overlay/60" />

        <BpiExplainSection />

        <Separator className="my-20 bg-bpim-overlay/30" />

        <ShowcaseSection
          tag={t("login.showcase.growth.tag")}
          title={t("login.showcase.growth.title")}
          visual={
            <div className="flex flex-col gap-4">
              <MockBpiHistoryChart />
              <MockCurrentBpiCard />
            </div>
          }
        >
          {t("login.showcase.growth.desc1")
            .split("<br />")
            .map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          <p>{t("login.showcase.growth.desc2")}</p>
        </ShowcaseSection>

        <Separator className="my-20 bg-bpim-overlay/30" />

        <ShowcaseSection
          tag={t("login.showcase.weakness.tag")}
          title={t("login.showcase.weakness.title")}
          flip
          visual={
            <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
              <MockRadarChart />
              <MockBpmBars />
            </div>
          }
        >
          <p>{t("login.showcase.weakness.desc1")}</p>
          <p>{t("login.showcase.weakness.desc2")}</p>
          <p>{t("login.showcase.weakness.desc3")}</p>
        </ShowcaseSection>

        <Separator className="my-20 bg-bpim-overlay/30" />

        <ShowcaseSection
          tag={t("login.showcase.dist.tag")}
          title={t("login.showcase.dist.title")}
          visual={
            <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
              <MockBpiDistribution />
              <MockActivityCalendar />
            </div>
          }
        >
          <p>{t("login.showcase.dist.desc1")}</p>
          <p>{t("login.showcase.dist.desc2")}</p>
        </ShowcaseSection>

        <Separator className="my-20 bg-bpim-overlay/30" />

        <ShowcaseSection
          tag={t("login.showcase.rivals.tag")}
          title={t("login.showcase.rivals.title")}
          flip
          visual={<MockRivalBars />}
        >
          <p>{t("login.showcase.rivals.desc1")}</p>
          <p>{t("login.showcase.rivals.desc2")}</p>
        </ShowcaseSection>

        <Separator className="my-20 bg-bpim-overlay/30" />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <ApiSection />
          <PrivacySection />
        </div>
      </PageContainer>
    </div>
  );
};
