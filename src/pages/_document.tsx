import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

const fontScript = `
(function() {
  var FONT_STORAGE_KEY = 'bpim2-font';
  var FONTS = {
    'mplus': {
      param: 'family=M+PLUS+Rounded+1c:wght@400;500;700',
      css: "'M PLUS Rounded 1c', sans-serif"
    },
    'sawarabi-mincho': {
      param: 'family=Sawarabi+Mincho',
      css: "'Sawarabi Mincho', serif"
    },
    'sawarabi-gothic': {
      param: 'family=Sawarabi+Gothic',
      css: "'Sawarabi Gothic', sans-serif"
    },
    'noto-sans-jp': {
      param: 'family=Noto+Sans+JP:wght@400;500;700',
      css: "'Noto Sans JP', sans-serif"
    }
  };
  var stored = localStorage.getItem(FONT_STORAGE_KEY);
  if (stored && FONTS[stored]) {
    var def = FONTS[stored];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + def.param + '&display=swap';
    document.head.appendChild(link);
    document.documentElement.style.setProperty('--bpim-font-family', def.css);
  }
})();
`;

const themeScript = `
(function() {
  var STORAGE_KEY = 'bpim2-theme';
  var DEFAULT = 'dark-blue';
  var valid = [
    'dark-blue','dark-green','dark-red','dark-orange','dark-yellow',
    'dark-purple','dark-pink','dark-cyan',
    'dark-abyss','dark-midnight','dark-forest','dark-ember','dark-onsen',
    'light-blue','light-green','light-rose','light-purple'
  ];
  var stored = localStorage.getItem(STORAGE_KEY);
  var theme = valid.indexOf(stored) !== -1 ? stored : DEFAULT;
  var html = document.documentElement;
  html.setAttribute('data-theme', theme);
  if (theme.startsWith('light')) {
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
        <script dangerouslySetInnerHTML={{ __html: fontScript }} />
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
