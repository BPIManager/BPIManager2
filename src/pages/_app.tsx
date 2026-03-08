"use client";

import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contexts/users/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PagesProgressBar as ProgressBar } from "next-nprogress-bar";
import { DarkMode } from "@/components/ui/color-mode";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <ProgressBar
        height="3px"
        color="#3182ce"
        options={{ showSpinner: true }}
        shallowRouting
      />
      <UserProvider>
        <DarkMode>
          <Toaster />
          <Component {...pageProps} />
        </DarkMode>
      </UserProvider>
    </Provider>
  );
}
