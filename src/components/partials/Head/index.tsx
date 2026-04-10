import Head from "next/head";
import { useRouter } from "next/router";

interface MetaProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
}

export const Meta = ({
  title,
  description = "BPIM2はbeatmaniaIIDX上級者向けのスコア管理ツールです",
  ogImage = "/ogp-default.png",
  ogType = "website",
  noIndex = false,
}: MetaProps) => {
  const router = useRouter();
  const siteName = "BPIM2";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const url = `https://bpi2.poyashi.me${router.asPath}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />

      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JsonLd = ({ data }: { data: Record<string, any> }) => (
  <Head>
    <script
      key="jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  </Head>
);
