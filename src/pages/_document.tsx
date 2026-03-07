import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html
      lang="ja"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <Head>
        <meta name="theme-color" content="#000000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
