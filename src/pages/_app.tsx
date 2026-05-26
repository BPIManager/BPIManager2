import "@/styles/globals.css";

import { UserProvider } from "@/contexts/users/UserContext";
import { LocaleProvider } from "@/contexts/locale/LocaleContext";
import type { AppProps } from "next/app";
import { PagesProgressBar as ProgressBar } from "next-nprogress-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { LocaleDetectionModal } from "@/components/partials/LocaleDetectionModal";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ProgressBar
        height="3px"
        color="#3182ce"
        options={{ showSpinner: true }}
        shallowRouting
      />
      <LocaleProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <LocaleDetectionModal />
            <Component {...pageProps} />
          </TooltipProvider>
        </UserProvider>
      </LocaleProvider>
    </>
  );
}
