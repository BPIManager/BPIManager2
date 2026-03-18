import "@/styles/globals.css";

import { Provider } from "@/components/ui/chakra/provider";
import { Toaster } from "@/components/ui/chakra/toaster";
import { UserProvider } from "@/contexts/users/UserContext";
import type { AppProps } from "next/app";
import { PagesProgressBar as ProgressBar } from "next-nprogress-bar";
import { DarkMode } from "@/components/ui/chakra/color-mode";
import { TooltipProvider } from "@/components/ui/tooltip";

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
          <TooltipProvider>
            <Toaster />
            <Component {...pageProps} />
          </TooltipProvider>
        </DarkMode>
      </UserProvider>
    </Provider>
  );
}
