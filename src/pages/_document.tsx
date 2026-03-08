import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html
      lang="ja"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <Head>
        <meta name="theme-color" content="#080808" />
        <link rel="manifest" href="/manifest.json" />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-98L27Y6ZDH"
        />
        <Script>
          {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-98L27Y6ZDH');`}
        </Script>
      </Head>
      <body style={{ backgroundColor: "#080808" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
