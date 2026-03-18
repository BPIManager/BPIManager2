import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

const themeScript = `
(function() {
  var STORAGE_KEY = 'bpim2-theme';
  var DEFAULT = 'dark-blue';
  var valid = ['dark-blue','dark-green','light-blue','light-green'];
  var stored = localStorage.getItem(STORAGE_KEY);
  var theme = valid.indexOf(stored) !== -1 ? stored : DEFAULT;
  var html = document.documentElement;
  html.setAttribute('data-theme', theme);
  if (theme === 'light-blue' || theme === 'light-green') {
    html.classList.remove('dark');
    html.classList.add('light');
    html.style.colorScheme = 'light';
  } else {
    html.classList.remove('light');
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  }
})();
`;

export default function Document() {
  return (
    <Html lang="ja" suppressHydrationWarning>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-98L27Y6ZDH"
        />
        <Script>
          {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-98L27Y6ZDH');`}
        </Script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
